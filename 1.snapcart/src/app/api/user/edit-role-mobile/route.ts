import { auth } from "@/auth";
import prisma from "@/lib/db";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { role, mobile } = await req.json()
        const session = await auth()

        if (!session || !session.user || !session.user.email) {
            throw new Error("unauthorized")
        }

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { role, mobile }
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
            { message: `edit role and mobile error ${error}` },
            { status: 500 }
        )
    }
}