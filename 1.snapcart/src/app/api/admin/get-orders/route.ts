import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const orders = await prisma.order.findMany({
            include: { user: true, assignedDeliveryBoy: true },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(
            orders, { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `get orders error: ${error}` }, { status: 500 }
        )
    }
}