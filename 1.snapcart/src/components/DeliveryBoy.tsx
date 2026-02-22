import React from 'react'
import DeliveryBoyDashboard from './DeliveryBoyDashboard'
import { auth } from '@/auth'
import prisma from '@/lib/db'

async function DeliveryBoy() {
  const session = await auth()
  const deliveryBoyId = session?.user?.id
  const orders = await prisma.order.findMany({
    where: {
      assignedDeliveryBoyId: deliveryBoyId,
      deliveryOtpVerification: true
    }
  })

  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => o.deliveredAt && new Date(o.deliveredAt).toDateString() === today).length
  const todaysEarning = todayOrders * 40

  return (
    <>
      <DeliveryBoyDashboard earning={todaysEarning} />
    </>
  )
}

export default DeliveryBoy
