import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
        items: items,
        paymentMethod: paymentMethod,
        totalAmount: totalAmount,
        addressLatitude: address.latitude,
        addressLongitude: address.longitude,
        addressFullAddress: address.address
      }
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.NEXT_BASE_URL}/user/order-success`,
      cancel_url: `${process.env.NEXT_BASE_URL}/user/order-cancel`,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'SnapCart Order Payment',
            },
            unit_amount: body.totalAmount * 100,
          },
          quantity: 1,
        },

      ],
      metadata: { orderId: newOrder.id }
    })

    return NextResponse.json({ url: session.url }, { status: 200 })


  } catch (error) {
    return NextResponse.json(
      { message: `order payment error ${error}` },
      { status: 500 }
    )
  }
}