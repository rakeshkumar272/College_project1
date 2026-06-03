import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        const { status } = await req.json();

        if (!status || !["ACTIVE", "BLOCKED"].includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        const agent = await prisma.user.findUnique({ where: { id } });
        if (!agent || agent.role !== "deliveryBoy") {
            return NextResponse.json({ message: "Agent not found" }, { status: 404 });
        }

        const updatedAgent = await prisma.user.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ 
            message: "Status updated successfully",
            agent: {
                id: updatedAgent.id,
                name: updatedAgent.name,
                phone: updatedAgent.mobile,
                status: updatedAgent.status,
                createdAt: updatedAgent.createdAt
            } 
        }, { status: 200 });
    } catch (error) {
        console.error("PATCH agent error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
