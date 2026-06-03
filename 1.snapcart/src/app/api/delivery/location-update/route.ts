import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { deliveryBoyId, latitude, longitude } = await req.json();

        if (!deliveryBoyId || latitude === undefined || longitude === undefined) {
            return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: deliveryBoyId },
            data: {
                latitude: Number(latitude),
                longitude: Number(longitude),
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ 
            message: "Location updated", 
            location: { latitude: updatedUser.latitude, longitude: updatedUser.longitude } 
        }, { status: 200 });

    } catch (error) {
        console.error("Location update error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
