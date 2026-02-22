import prisma from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { orderId, otp } = await req.json()
        if (!orderId || !otp) {
            return NextResponse.json(
                { message: "orderId or OTP not found" },
                { status: 400 }
            )
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        })
        if (!order) {
            return NextResponse.json(
                { message: "order not found" },
                { status: 400 }
            )
        }

        if (order.deliveryOtp !== otp) {
            return NextResponse.json(
                { message: "Incorrect or expired Otp" },
                { status: 400 }
            )
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "delivered",
                deliveryOtpVerification: true,
                deliveredAt: new Date()
            }
        })

        await emitEventHandler("order-status-update", { orderId: updatedOrder.id, status: updatedOrder.status })

        await prisma.deliveryAssignment.update({
            where: { orderId: orderId },
            data: { assignedToId: null, status: "completed" }
        })
        return NextResponse.json(
            { message: "Delivery successfully completed" },
            { status: 200 }
        )


    } catch (error) {
        return NextResponse.json(
            { message: `verify otp error ${error}` },
            { status: 500 }
        )
    }
}