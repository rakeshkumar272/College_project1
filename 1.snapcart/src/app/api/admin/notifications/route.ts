import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth()
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const pendingOrdersCount = await prisma.order.count({
            where: { status: "pending" }
        })

        const pendingDeliveriesCount = await prisma.deliveryAssignment.count({
            where: { status: "brodcasted" }
        })

        return NextResponse.json({
            pendingOrdersCount,
            pendingDeliveriesCount,
        }, { status: 200 })
    } catch (error) {
        return NextResponse.json(
            { message: `Error fetching notifications: ${error}` },
            { status: 500 }
        )
    }
}
