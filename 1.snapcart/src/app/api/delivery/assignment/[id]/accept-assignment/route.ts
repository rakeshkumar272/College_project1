import { auth } from "@/auth";
import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string; }>; }) {
    try {
        const { id } = await context.params
        const session = await auth()
        const deliveryBoyId = session?.user?.id
        if (!deliveryBoyId) {
            return NextResponse.json({ message: "unauthorize" }, { status: 400 })
        }

        const assignment = await prisma.deliveryAssignment.findUnique({
            where: { id }
        })
        if (!assignment) {
            return NextResponse.json({ message: "assignment not found" }, { status: 400 })
        }
        if (assignment.status !== "brodcasted") {
            return NextResponse.json({ message: "assignment expired" }, { status: 400 })
        }

        const alreadyAssigned = await prisma.deliveryAssignment.findFirst({
            where: {
                assignedToId: deliveryBoyId,
                status: { notIn: ["brodcasted", "completed"] }
            }
        })

        if (alreadyAssigned) {
            return NextResponse.json({ message: "already assigned to other order" }, { status: 400 })
        }

        const updatedAssignment = await prisma.deliveryAssignment.update({
            where: { id },
            data: {
                assignedToId: deliveryBoyId,
                status: "assigned",
                acceptedAt: new Date()
            }
        })

        const order = await prisma.order.update({
            where: { id: assignment.orderId },
            data: { assignedDeliveryBoyId: deliveryBoyId },
            include: { assignedDeliveryBoy: true }
        })

        await emitEventHandler("order-assigned", { orderId: order.id, assignedDeliveryBoy: order.assignedDeliveryBoyId })

        // Prisma doesn't easily support pulling an item from an array in a many-to-many relationship in a single bulk update
        // Need to disconnect the delivery boy from all other broadcasted assignments
        const otherAssignments = await prisma.deliveryAssignment.findMany({
            where: {
                id: { not: assignment.id },
                broadcastedTo: { some: { id: deliveryBoyId } },
                status: "brodcasted"
            }
        });

        for (const other of otherAssignments) {
            await prisma.deliveryAssignment.update({
                where: { id: other.id },
                data: {
                    broadcastedTo: {
                        disconnect: { id: deliveryBoyId }
                    }
                }
            })
        }

        return NextResponse.json({ message: "order accepted successfully" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ message: `accept assignment error ${error}` }, { status: 500 })
    }
}