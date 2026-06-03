import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, items, paymentMethod, totalAmount, address } = body
        if (!items || !userId || !paymentMethod || !totalAmount || !address) {
            console.log("Missing fields in order checkout:", { items, userId, paymentMethod, totalAmount, address });
            return NextResponse.json(
                { message: "please send all credentials" },
                { status: 400 }
            )
        }
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            console.log("User not found:", userId);
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }

        // ENFORCE USER STATUS
        if (user.status === "RESTRICTED" || user.status === "BLOCKED") {
            console.log("User restricted/blocked:", user.status);
            return NextResponse.json(
                { message: "Your account is restricted from placing orders." },
                { status: 403 }
            )
        }

        // STOCK VALIDATION
        for (const item of items) {
            if (item.variant) {
                const variant = await prisma.groceryVariant.findUnique({ 
                    where: { id: item.variant } 
                });
                if (!variant) {
                    console.log("Variant not found:", item.variant, item.name);
                    return NextResponse.json({ message: `Product variant not found: ${item.name}` }, { status: 400 });
                }
                if (variant.stockQuantity < item.quantity) {
                    console.log("Not enough stock:", variant.stockQuantity, "requested:", item.quantity);
                    return NextResponse.json({ 
                        message: `Only ${variant.stockQuantity} items available for ${item.name} (${variant.label})` 
                    }, { status: 400 });
                }
            }
        }

        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId: userId,
                    paymentMethod: paymentMethod,
                    totalAmount: totalAmount,
                    addressFullName: address.fullName,
                    addressMobile: address.mobile,
                    addressCity: address.city,
                    addressState: address.state,
                    addressPincode: address.pincode,
                    addressLatitude: Number(address.latitude),
                    addressLongitude: Number(address.longitude),
                    addressFullAddress: address.fullAddress,
                    items: {
                        create: items.map((item: any) => ({
                            groceryId: item.productId || item.grocery,
                            name: item.name,
                            price: item.price.toString(),
                            unit: item.unit.toString(),
                            image: item.image,
                            quantity: Number(item.quantity)
                        }))
                    }
                }
            });

            // DEDUCT STOCK
            for (const item of items) {
                if (item.variant) {
                    const variant = await tx.groceryVariant.findUnique({ where: { id: item.variant } });
                    if (variant) {
                        const newQty = variant.stockQuantity - Number(item.quantity);
                        let newStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
                        if (newQty <= 0) newStatus = "OUT_OF_STOCK";
                        else if (newQty <= 5) newStatus = "LOW_STOCK";

                        await tx.groceryVariant.update({
                            where: { id: item.variant },
                            data: {
                                stockQuantity: newQty,
                                stockStatus: newStatus
                            }
                        });
                    }
                }
            }
            return order;
        });

        // Natively search for nearby delivery boys & create assignment immediately
        const allDeliveryBoys = await prisma.user.findMany({
            where: { role: "deliveryBoy", isOnline: true }
        });

        const latitude = Number(address.latitude);
        const longitude = Number(address.longitude);
        const R = 6371e3; // metres
        
        const nearByDeliveryBoys = allDeliveryBoys.filter((boy: any) => {
            if (!boy.latitude || !boy.longitude) return false;
            const dLat = (boy.latitude - latitude) * Math.PI / 180;
            const dLon = (boy.longitude - longitude) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(latitude * Math.PI / 180) * Math.cos(boy.latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c <= 10000; // 10km radius
        });

        const nearByIds = nearByDeliveryBoys.map((b: any) => b.id);
        const busyAssignments = await prisma.deliveryAssignment.findMany({
            where: {
                assignedToId: { in: nearByIds },
                status: { notIn: ["brodcasted", "completed"] }
            },
            select: { assignedToId: true }
        });

        const busyIdSet = new Set(busyAssignments.map((b: any) => b.assignedToId).filter(Boolean));
        const availableDeliveryBoys = nearByDeliveryBoys.filter((b: any) => !busyIdSet.has(b.id));
        
        let candidates = availableDeliveryBoys;
        if (candidates.length === 0) {
            candidates = allDeliveryBoys; // Fallback to all online if none nearby
        }

        let assignedBoy = candidates.length > 0 ? candidates[0] : null;

        if (assignedBoy) {
            const deliveryAssignment = await prisma.deliveryAssignment.create({
                data: {
                    orderId: newOrder.id,
                    status: "assigned",
                    assignedToId: assignedBoy.id
                },
                include: { order: true }
            });

            // Update order immediately to reflect assigned status
            await prisma.order.update({
                where: { id: newOrder.id },
                data: {
                    status: "assigned",
                    assignedDeliveryBoyId: assignedBoy.id
                }
            })

            // Only notify the specifically assigned delivery boy
            if (assignedBoy.socketId) {
                await emitEventHandler("new-assignment", deliveryAssignment, assignedBoy.socketId);
            }
        } else {
             await prisma.deliveryAssignment.create({
                data: {
                    orderId: newOrder.id,
                    status: "pending_assignment",
                },
                include: { order: true }
            });
        }

        await emitEventHandler("new-order", newOrder)

        return NextResponse.json(
            newOrder,
            { status: 201 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: `place order error ${error}` },
            { status: 500 }
        )
    }
}