import { auth } from "@/auth";
import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { orderId } = await req.json();

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Check 5-minute window
        const now = new Date();
        const diff = (now.getTime() - order.createdAt.getTime()) / (1000 * 60);
        
        if (diff > 5) {
            return NextResponse.json({ message: "Cancellation window (5 mins) has expired" }, { status: 400 });
        }

        if (order.status !== "pending") {
            return NextResponse.json({ message: "Cannot cancel order after it has been assigned or processed" }, { status: 400 });
        }

        const cancelledOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: "cancelled" }
        });

        await emitEventHandler("order-cancelled", { orderId: order.id, status: "cancelled" });

        return NextResponse.json({ message: "Order cancelled successfully", order: cancelledOrder }, { status: 200 });

    } catch (error) {
        console.error("Cancel order error:", error);
        return NextResponse.json({ message: `Internal Server Error: ${error}` }, { status: 500 });
    }
}
