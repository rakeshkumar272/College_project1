import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, location, latitude: flatLat, longitude: flatLng } = body
        const id = userId?.id || userId?._id || userId;

        if (!id) {
            return NextResponse.json(
                { message: "missing userId" },
                { status: 400 }
            )
        }

        let latitude = flatLat;
        let longitude = flatLng;

        if (location?.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
            longitude = location.coordinates[0];
            latitude = location.coordinates[1];
        } else if (location?.latitude !== undefined) {
            latitude = location.latitude;
            longitude = location.longitude;
        }

        console.log(`UPDATE-LOCATION: id=\${id}, lat=\${latitude}, lon=\${longitude}`);

        const user = await prisma.user.update({
            where: { id: id },
            data: {
                latitude: (latitude !== undefined && latitude !== null) ? Number(latitude) : null,
                longitude: (longitude !== undefined && longitude !== null) ? Number(longitude) : null
            }
        })

        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { message: "location updated", success: true },
            { status: 200 }
        )
    } catch (error) {
        console.error("Update location error:", error);
        return NextResponse.json(
            { message: `update location error \${error}` },
            { status: 500 }
        )
    }
}