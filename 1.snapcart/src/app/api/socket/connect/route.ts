import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId, socketId } = await req.json()
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                socketId,
                isOnline: true
            }
        })
        if (!user) {
            return NextResponse.json({ message: "user not found" }, { status: 400 })
        }
        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}