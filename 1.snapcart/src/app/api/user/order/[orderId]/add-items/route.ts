import { auth } from "@/auth";
import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const { orderId } = await params;
        const data = await req.json();

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
            return NextResponse.json({ message: "Can only add items to pending orders." }, { status: 400 });
        }

        // Validate time limit (2 minutes)
        const TWO_MINUTES = 2 * 60 * 1000;
        const now = new Date();
        const timeDiff = now.getTime() - order.createdAt.getTime();

        if (timeDiff > TWO_MINUTES) {
            return NextResponse.json({ message: "Add items time limit exceeded (2 mins)." }, { status: 400 });
        }

        const newTotal = order.totalAmount + data.totalAmount;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                totalAmount: newTotal,
                items: {
                    create: data.items
                }
            },
            include: { user: true, items: true }
        });

        // Notify admin to update their dashboard
        await emitEventHandler("new-order", updatedOrder);

        return NextResponse.json({ message: "Items added successfully.", order: updatedOrder }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: `Add items error: ${error}` }, { status: 500 });
    }
}
