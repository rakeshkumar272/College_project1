import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId, location } = await req.json()
        if (!userId || !location) {
            return NextResponse.json(
                { message: "missing userId or Location" },
                { status: 400 }
            )
        }

        // location in mongoose was an object { type: "Point", coordinates: [lng, lat] }
        // We altered the schema to use latitude and longitude float fields
        let latitude = null;
        let longitude = null;
        if (location?.coordinates && location.coordinates.length === 2) {
            // GeoJSON coordinates are [longitude, latitude]
            longitude = location.coordinates[0];
            latitude = location.coordinates[1];
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                latitude,
                longitude
            }
        })
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { message: "location updated" },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: `update location error ${error}` },
            { status: 500 }
        )
    }
}