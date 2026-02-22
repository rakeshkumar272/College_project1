import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { message: "user is not authenticated" },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, email: true, mobile: true, role: true, image: true, latitude: true, longitude: true, socketId: true, isOnline: true, createdAt: true, updatedAt: true }
        })
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            user,
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: `get me error : ${error}` },
            { status: 500 }
        )
    }
}