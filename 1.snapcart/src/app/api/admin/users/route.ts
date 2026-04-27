import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: `Error fetching users: ${error}` }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { userId } = await req.json();
        await prisma.user.delete({ where: { id: userId } });
        
        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: `Error deleting user: ${error}` }, { status: 500 });
    }
}
