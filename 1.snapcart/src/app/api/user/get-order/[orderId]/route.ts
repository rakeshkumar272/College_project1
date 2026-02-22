import prisma from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, context: { params: Promise<{ orderId: string; }>; }) {
    try {
        const { orderId } = await context.params
        console.log(orderId)
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { assignedDeliveryBoy: true }
        })
        if (!order) {
            return NextResponse.json(
                { message: "order not found" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            order,
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `get order by id error ${error}` },
            { status: 500 }
        )
    }
}