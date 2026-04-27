import { auth } from "@/auth";
import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "deliveryBoy") {
            return NextResponse.json({ message: "Forbidden: Delivery Partner access required" }, { status: 403 });
        }

        const { orderId, status } = await req.json();

        if (!orderId || !status) {
            return NextResponse.json({ message: "Missing orderId or status" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { assignment: true }
        });

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // Verify the order is assigned to this delivery boy
        if (order.assignedDeliveryBoyId !== session.user.id) {
            return NextResponse.json({ message: "Forbidden: Order not assigned to you" }, { status: 403 });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status }
        });

        // If status is "out for delivery", update the assignment status too
        if (status === "out of delivery" && order.assignment) {
            await prisma.deliveryAssignment.update({
                where: { id: order.assignment.id },
                data: { status: "out_for_delivery" }
            });
        }

        await emitEventHandler("order-status-update", { orderId: order.id, status });

        return NextResponse.json({ message: "Status updated successfully", status: updatedOrder.status }, { status: 200 });

    } catch (error) {
        console.error("Update delivery status error:", error);
        return NextResponse.json({ message: `Internal Server Error: ${error}` }, { status: 500 });
    }
}
