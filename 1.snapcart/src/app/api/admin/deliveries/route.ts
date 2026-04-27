import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
        }

        const activeDeliveries = await prisma.deliveryAssignment.findMany({
            where: {
                status: { not: "completed" }
            },
            include: {
                order: {
                    include: {
                        user: true
                    }
                },
                assignedTo: true
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(activeDeliveries, { status: 200 });

    } catch (error) {
        console.error("Get active deliveries error:", error);
        return NextResponse.json({ message: `Internal Server Error: ${error}` }, { status: 500 });
    }
}
