import { auth } from "@/auth";

import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (session?.user?.role !== "admin") {
            return NextResponse.json(
                { message: "you are not admin" },
                { status: 400 }
            )
        }
        const { groceryId } = await req.json()
        const grocery = await prisma.grocery.delete({ where: { id: groceryId } })
        return NextResponse.json(
            grocery,
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `delete grocery error ${error}` },
            { status: 500 }
        )
    }
}


