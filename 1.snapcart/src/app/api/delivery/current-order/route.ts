import { auth } from "@/auth";
import prisma from "@/lib/db";

import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth()
        const deliveryBoyId = session?.user?.id
        if (!deliveryBoyId) throw new Error("Unauthorized")

        const activeAssignment = await prisma.deliveryAssignment.findFirst({
            where: {
                assignedToId: deliveryBoyId,
                status: "assigned"
            },
            include: {
                order: true
            }
        })
        if (!activeAssignment) {
            return NextResponse.json(
                { active: false },
                { status: 200 }
            )
        }
        return NextResponse.json(
            { active: true, assignment: activeAssignment },
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: `current order error ${error}` },
            { status: 200 }
        )
    }
}