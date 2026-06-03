import prisma from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json()
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true }
        })
        if (!order) {
            return NextResponse.json(
                { message: "order not found" },
                { status: 400 }
            )
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString()

        await prisma.order.update({
            where: { id: orderId },
            data: { deliveryOtp: otp }
        })

        try {
            await sendMail(
                order.user.email,
                "Your Delivery OTP",
                `<h2>Your Delivery OTP is <strong>${otp}</strong></h2>`
            )
        } catch (mailError) {
            console.error("Failed to send email due to credentials/network, but OTP was generated. OTP:", otp);
            console.error("Mail Error:", mailError);
        }

        return NextResponse.json(
            { message: "otp sent successfully", devOtp: otp },
            { status: 200 }
        )

    } catch (error) {
        console.error("send otp error details:", error);
        return NextResponse.json(
            { message: `send otp error ${error}` },
            { status: 500 }
        )
    }
}