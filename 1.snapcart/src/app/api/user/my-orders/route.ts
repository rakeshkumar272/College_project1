import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            include: { user: true, assignedDeliveryBoy: true },
            orderBy: { createdAt: 'desc' }
        })
        if (!orders) {
            return NextResponse.json({ message: "orders not found" }, { status: 400 })
        }
        return NextResponse.json(orders, { status: 200 })

    } catch (error) {
        return NextResponse.json({ message: `get all orders error:${error}` }, { status: 500 })
    }
}