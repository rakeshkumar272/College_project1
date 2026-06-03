import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, context: { params: Promise<{ orderId: string; }>; }) {
    try {
        const { orderId } = await context.params
        const { status } = await req.json()
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true, assignment: true }
        })

        if (!order) {
            return NextResponse.json(
                { message: "order not found" },
                { status: 400 }
            )
        }

        let deliveryBoysPayload: any = []

        if (status === "out of delivery") {
            const latitude = order.addressLatitude;
            const longitude = order.addressLongitude;

            let candidates: string[] = [];
            const allDeliveryBoys = await prisma.user.findMany({
                where: { role: "deliveryBoy", isOnline: true, status: "ACTIVE" }
            });

            if (latitude && longitude) {
                // Prisma currently doesn't natively support PostGIS distance queries without raw queries
                // Fetching delivery boys and filtering roughly 
                const R = 6371e3; // metres
                const nearByDeliveryBoys = allDeliveryBoys.filter(boy => {
                    if (!boy.latitude || !boy.longitude) return false;
                    const dLat = (boy.latitude - latitude) * Math.PI / 180;
                    const dLon = (boy.longitude - longitude) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(latitude * Math.PI / 180) * Math.cos(boy.latitude * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c <= 10000; // 10km radius
                });

                const nearByIds = nearByDeliveryBoys.map(b => b.id)
                const busyAssignments = await prisma.deliveryAssignment.findMany({
                    where: {
                        assignedToId: { in: nearByIds },
                        status: { notIn: ["brodcasted", "completed"] }
                    },
                    select: { assignedToId: true }
                })

                const busyIdSet = new Set(busyAssignments.map(b => b.assignedToId).filter(Boolean))
                const availableDeliveryBoys = nearByDeliveryBoys.filter(
                    b => !busyIdSet.has(b.id)
                )
                candidates = availableDeliveryBoys.map(b => b.id)
            }

            // FALLBACK: If no online riders are within 10km (or coordinates missing), broadcast to ALL online riders
            if (candidates.length === 0) {
                candidates = allDeliveryBoys.map(b => b.id);
            }

            const targetBoyId = candidates.length > 0 ? candidates[0] : undefined;

            if (!targetBoyId) {
                return NextResponse.json({ message: "No delivery boys online" }, { status: 400 });
            }

            let deliveryAssignment;
            if (order.assignment) {
                deliveryAssignment = await prisma.deliveryAssignment.update({
                    where: { id: order.assignment.id },
                    data: {
                        status: "assigned",
                        assignedToId: targetBoyId,
                        acceptedAt: new Date()
                    },
                    include: { order: true }
                })
            } else {
                deliveryAssignment = await prisma.deliveryAssignment.create({
                    data: {
                        orderId: order.id,
                        status: "assigned",
                        assignedToId: targetBoyId,
                        acceptedAt: new Date()
                    },
                    include: { order: true }
                })
            }

            const targetBoy = allDeliveryBoys.find(b => b.id === targetBoyId);
            
            if (targetBoy && targetBoy.socketId) {
                await emitEventHandler("new-assignment", deliveryAssignment, targetBoy.socketId)
            }

            deliveryBoysPayload = targetBoy ? [targetBoy].map(b => ({
                id: b.id,
                name: b.name,
                mobile: b.mobile,
                latitude: b.latitude,
                longitude: b.longitude
            })) : []

            await prisma.order.update({
                where: { id: orderId },
                data: { 
                    status: "assigned",
                    assignedDeliveryBoyId: targetBoyId
                }
            })

            await emitEventHandler("order-status-update", { orderId: order.id, status: "assigned" })

            return NextResponse.json({
                assignment: deliveryAssignment.id,
                availableBoys: deliveryBoysPayload
            }, { status: 200 })
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status }
        })
        await emitEventHandler("order-status-update", { orderId: order.id, status })

        if (status === "delivered" && order.userId) {
            const user = await prisma.user.findUnique({ where: { id: order.userId } })
            if (user) {
                const newTotalOrders = (user.totalOrders || 0) + 1;
                const newTotalSpent = (user.totalSpent || 0) + order.totalAmount;
                const isTopBuyer = newTotalOrders > 10 || newTotalSpent > 5000;
                
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        totalOrders: newTotalOrders,
                        totalSpent: newTotalSpent,
                        isTopBuyer
                    }
                })
            }
        }

        return NextResponse.json({
            assignment: order.assignment?.id,
            availableBoys: deliveryBoysPayload
        }, { status: 200 })

    } catch (error) {
        console.error(error)
        return NextResponse.json({
            message: `update status error ${error}`
        }, { status: 500 })
    }
}