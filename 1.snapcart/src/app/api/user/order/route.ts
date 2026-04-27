import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, items, paymentMethod, totalAmount, address } = body
        if (!items || !userId || !paymentMethod || !totalAmount || !address) {
            return NextResponse.json(
                { message: "please send all credentials" },
                { status: 400 }
            )
        }
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }

        // ENFORCE USER STATUS
        if (user.status === "RESTRICTED" || user.status === "BLOCKED") {
            return NextResponse.json(
                { message: "Your account is restricted from placing orders." },
                { status: 403 }
            )
        }

        const newOrder = await prisma.order.create({
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
                        groceryId: item.grocery,
                        name: item.name,
                        price: item.price.toString(),
                        unit: item.unit.toString(),
                        image: item.image,
                        quantity: Number(item.quantity)
                    }))
                }
            }
        })

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