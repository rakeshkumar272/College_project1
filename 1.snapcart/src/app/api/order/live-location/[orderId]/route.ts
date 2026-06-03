import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const { orderId } = await params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                assignedDeliveryBoy: true
            }
        });

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        if (!order.assignedDeliveryBoy) {
            return NextResponse.json({ 
                status: order.status,
                deliveryBoy: null,
                message: "No delivery partner assigned yet" 
            }, { status: 200 });
        }

        const db = order.assignedDeliveryBoy;
        const customerLat = order.addressLatitude;
        const customerLon = order.addressLongitude;
        const boyLat = db.latitude;
        const boyLon = db.longitude;

        let eta = "Calculating...";
        let distanceInKm = 0;

        if (customerLat && customerLon && boyLat && boyLon) {
            // Haversine formula
            const R = 6371; // km
            const dLat = (boyLat - customerLat) * Math.PI / 180;
            const dLon = (boyLon - customerLon) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(customerLat * Math.PI / 180) * Math.cos(boyLat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distanceInKm = R * c;

            // Assuming avg speed of 20km/h in city traffic
            const timeInMinutes = Math.round((distanceInKm / 20) * 60) + 2; // +2 mins for pickup/parking
            eta = `${timeInMinutes} mins`;
        }

        return NextResponse.json({
            orderStatus: order.status,
            deliveryBoy: {
                id: db.id,
                name: db.name,
                latitude: boyLat,
                longitude: boyLon,
                isOnline: db.isOnline
            },
            customerLocation: {
                latitude: customerLat,
                longitude: customerLon
            },
            eta,
            distance: distanceInKm.toFixed(2) + " km"
        }, { status: 200 });

    } catch (error) {
        console.error("Live location fetch error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
