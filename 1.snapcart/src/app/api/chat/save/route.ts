import prisma from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const { senderId, text, roomId, time } = await req.json()
        const room = await prisma.order.findUnique({ where: { id: roomId } })
        if (!room) {
            return NextResponse.json(
                { message: `room not found` }, { status: 400 }
            )
        }

        const message = await prisma.message.create({
            data: { senderId, text, roomId, time }
        })
        return NextResponse.json(
            message, { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `save message error ${error}` }, { status: 500 }
        )
    }
}