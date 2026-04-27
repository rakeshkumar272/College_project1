import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        const deliveryBoyId = session?.user?.id;
        if (!deliveryBoyId) {
            return NextResponse.json({ count: 0 }, { status: 401 });
        }

        const boy = await prisma.user.findUnique({ where: { id: deliveryBoyId } });
        if (!boy || !boy.latitude || !boy.longitude) {
            return NextResponse.json({ count: 0 }, { status: 200 });
        }

        const pendingAssignments = await prisma.deliveryAssignment.findMany({
            where: {
                status: "pending_assignment" // Filter on unassigned orders
            },
            include: {
                order: true
            }
        });

        const R = 6371e3; // metres
        let nearbyCount = 0;

        for (const assignment of pendingAssignments) {
            if (assignment.order && assignment.order.addressLatitude && assignment.order.addressLongitude) {
                const dLat = (boy.latitude - assignment.order.addressLatitude) * Math.PI / 180;
                const dLon = (boy.longitude - assignment.order.addressLongitude) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(assignment.order.addressLatitude * Math.PI / 180) * Math.cos(boy.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                if (distance <= 10000) { // 10 km
                    nearbyCount++;
                }
            }
        }

        return NextResponse.json({ count: nearbyCount }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: `Error ${error}` }, { status: 500 });
    }
}
