import React from 'react'
import AdminDashboardClient from './AdminDashboardClient'
import prisma from '@/lib/db'

async function AdminDashboard() {
  const orders = await prisma.order.findMany({ include: { user: true } })
  const users = await prisma.user.findMany({ where: { role: "user" } })
  const groceries = await prisma.grocery.findMany()

  const totalOrders = orders.length
  const totalCustomers = users.length
  const pendingDeliveries = orders.filter((o) => o.status === "pending").length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const today = new Date()
  const startOfToday = new Date(today)
  startOfToday.setHours(0, 0, 0, 0)


  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 6)

  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= startOfToday)
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const sevenDaysOrders = orders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo)
  const sevenDaysRevenue = sevenDaysOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const stats = [
    { title: "Total Orders", value: totalOrders },
    { title: "Total Customers", value: totalCustomers },
    { title: "Pending Deliveries", value: pendingDeliveries },
    { title: "Total Revenue", value: totalRevenue },
  ];

  const chartData = []

  for (let i = 6; i >= 0; i--) {

    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)


    const dayOrders = orders.filter((o) => new Date(o.createdAt) >= date && new Date(o.createdAt) < nextDay)
    const ordersCount = dayOrders.length
    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    const newCustomersCount = users.filter((u) => new Date(u.createdAt) >= date && new Date(u.createdAt) < nextDay).length

    chartData.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      orders: ordersCount,
      revenue: dayRevenue,
      customers: newCustomersCount
    })

  }




  return (
    <>
      <AdminDashboardClient
        revenueSummary={{
          today: todayRevenue,
          ordersToday: todayOrders.length,
          pendingDeliveries: pendingDeliveries,
          activeDeliveryPartners: users.filter((u) => u.role === "delivery" || u.role === "deliveryBoy").length
        }}
        stats={stats}
        chartData={chartData}
        recentOrders={orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10) as any}
      />
    </>
  )
}

export default AdminDashboard
