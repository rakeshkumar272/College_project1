import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, items, paymentMethod, totalAmount, address } = body
        if (!items || !userId || !paymentMethod || !totalAmount || !address) {
            return NextResponse.json(
                { message: "please send all credentials" },
                { status: 400 }
            )
        }
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }

        const newOrder = await prisma.order.create({
            data: {
                userId: userId,
                paymentMethod: paymentMethod,
                totalAmount: totalAmount,
                addressFullName: address.fullName,
                addressMobile: address.mobile,
                addressCity: address.city,
                addressState: address.state,
                addressPincode: address.pincode,
                addressLatitude: Number(address.latitude),
                addressLongitude: Number(address.longitude),
                addressFullAddress: address.fullAddress,
                items: {
                    create: items.map((item: any) => ({
                        groceryId: item.grocery,
                        name: item.name,
                        price: item.price.toString(),
                        unit: item.unit.toString(),
                        image: item.image,
                        quantity: Number(item.quantity)
                    }))
                }
            }
        })


        await emitEventHandler("new-order", newOrder)

        return NextResponse.json(
            newOrder,
            { status: 201 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: `place order error ${error}` },
            { status: 500 }
        )
    }
}