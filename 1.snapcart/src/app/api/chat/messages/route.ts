import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { roomId } = await req.json()
        let room = await prisma.order.findUnique({
            where: { id: roomId }
        })
        if (!room) {
            return NextResponse.json(
                { message: `room not found` }, { status: 400 }
            )
        }

        const messages = await prisma.message.findMany({ where: { roomId: room.id } })


        return NextResponse.json(
            messages, { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `get messages  error ${error}` }, { status: 500 }
        )
    }
}