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

        if (status === "out of delivery" && !order.assignment) {
            const latitude = order.addressLatitude;
            const longitude = order.addressLongitude;

            if (!latitude || !longitude) throw new Error("Missing coordinates for order")

            // Prisma currently doesn't natively support PostGIS distance queries without raw queries
            // Fetching delivery boys and filtering roughly 
            const allDeliveryBoys = await prisma.user.findMany({
                where: { role: "deliveryBoy", isOnline: true }
            });

            // Haversine formula roughly computing in JS (Normally you'd use raw SQL)
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
            let candidates = availableDeliveryBoys.map(b => b.id)

            // FALLBACK: If no online riders are within 10km, broadcast to ALL online riders
            // This ensures the order is visible during testing/development
            if (candidates.length === 0) {
                candidates = allDeliveryBoys.map(b => b.id);
            }

            // If no nearby candidates, we'll still create the assignment so it's tracked
            // but we might want to log it or notify the admin
            const broadcastedTo = candidates.length > 0 ? { connect: candidates.map(id => ({ id })) } : undefined

            const deliveryAssignment = await prisma.deliveryAssignment.create({
                data: {
                    orderId: order.id,
                    status: "brodcasted",
                    broadcastedTo: broadcastedTo
                },
                include: { order: true }
            })

            const targetBoys = candidates.length > availableDeliveryBoys.length ? allDeliveryBoys : availableDeliveryBoys;
            console.log(`Broadcasting order ${order.id} to ${targetBoys.length} boys (Fallback: ${candidates.length > availableDeliveryBoys.length})`);

            for (const boy of targetBoys) {
                if (boy.socketId) {
                    console.log(`Emitting new-assignment to boy ${boy.name} (${boy.socketId})`);
                    await emitEventHandler("new-assignment", deliveryAssignment, boy.socketId)
                }
            }

            deliveryBoysPayload = targetBoys.map(b => ({
                id: b.id,
                name: b.name,
                mobile: b.mobile,
                latitude: b.latitude,
                longitude: b.longitude
            }))

            await prisma.order.update({
                where: { id: orderId },
                data: { status }
            })

            await emitEventHandler("order-status-update", { orderId: order.id, status })

            return NextResponse.json({
                assignment: deliveryAssignment.id,
                availableBoys: deliveryBoysPayload
            }, { status: 200 })

        }

        await prisma.order.update({
            where: { id: orderId },
            data: { status }
        })
        await emitEventHandler("order-status-update", { orderId: order.id, status })

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