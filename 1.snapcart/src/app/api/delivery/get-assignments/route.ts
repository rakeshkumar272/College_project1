import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        const assignments = await prisma.deliveryAssignment.findMany({
            where: {
                broadcastedTo: { some: { id: session.user.id } },
                status: "brodcasted"
            },
            include: { order: true }
        })
        return NextResponse.json(
            assignments, { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `get assignments error ${error}` }, { status: 200 }
        )
    }
}