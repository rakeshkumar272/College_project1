import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
    const sig = req.headers.get("stripe-signature")
    const rawBody = await req.text()
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error) {
        console.error("signature verification failed", error)
    }

    if (event?.type === "checkout.session.completed") {
        const session = event.data.object
        await prisma.order.update({
            where: { id: session?.metadata?.orderId },
            data: { isPaid: true }
        })
    }

    return NextResponse.json({ recieved: true }, { status: 200 })

}