import { auth } from "@/auth";
import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const { orderId } = await params;

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // Must belong to the user
        if (order.userId !== session.user.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        if (order.status !== "pending") {
            return NextResponse.json({ message: "Only pending orders can be canceled" }, { status: 400 });
        }

        // Validate time limit (5 minutes)
        const FIVE_MINUTES = 5 * 60 * 1000;
        const now = new Date();
        const timeDiff = now.getTime() - order.createdAt.getTime();

        if (timeDiff > FIVE_MINUTES) {
            return NextResponse.json({ message: "Cancel time limit exceeded (5 mins)" }, { status: 400 });
        }

        const canceledOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: "canceled" }
        });

        // Delete any related broadcasted assignments just in case
        await prisma.deliveryAssignment.deleteMany({
            where: { orderId: orderId }
        });

        await emitEventHandler("order-status-update", { orderId: canceledOrder.id, status: "canceled" });

        return NextResponse.json({ message: "Order canceled successfully." }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: `Cancel error: ${error}` }, { status: 500 });
    }
}
