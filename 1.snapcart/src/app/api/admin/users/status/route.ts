import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { userId, status } = await req.json();

        if (!userId || !status) {
            return NextResponse.json({ message: "userId and status are required" }, { status: 400 });
        }

        const allowedStatuses = ["ACTIVE", "BLOCKED", "RESTRICTED"];
        if (!allowedStatuses.includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { status }
        });

        return NextResponse.json({ message: `User status updated to ${status}`, user }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: `Error updating user status: ${error}` }, { status: 500 });
    }
}
