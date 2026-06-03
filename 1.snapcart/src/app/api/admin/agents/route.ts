import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const agents = await prisma.user.findMany({
            where: { role: "deliveryBoy" },
            select: { id: true, name: true, mobile: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });

        // Map mobile to phone for frontend consistency as requested
        const mappedAgents = agents.map(a => ({
            id: a.id,
            name: a.name,
            phone: a.mobile,
            status: a.status,
            createdAt: a.createdAt
        }));

        return NextResponse.json({ agents: mappedAgents }, { status: 200 });
    } catch (error) {
        console.error("GET agents error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { name, phone } = await req.json();

        if (!name || !phone) {
            return NextResponse.json({ message: "Name and phone are required" }, { status: 400 });
        }

        // Creating the agent. To prevent unique constraint issues on email, we can generate a mock email.
        const mockEmail = `agent_${Date.now()}@speedymart.internal`;

        const newAgent = await prisma.user.create({
            data: {
                name,
                email: mockEmail, // Required by schema
                mobile: phone,
                role: "deliveryBoy",
                status: "ACTIVE"
            }
        });

        return NextResponse.json({ 
            agent: {
                id: newAgent.id,
                name: newAgent.name,
                phone: newAgent.mobile,
                status: newAgent.status,
                createdAt: newAgent.createdAt
            } 
        }, { status: 201 });
    } catch (error) {
        console.error("POST agent error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
