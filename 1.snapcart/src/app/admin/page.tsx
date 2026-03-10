import React from 'react'
import AdminDashboardClient from '@/components/AdminDashboardClient'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic';

async function AdminDashboardPage() {
    // Fetch orders with user details, sorted by newest
    const orders = await prisma.order.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    })

    const totalCustomers = await prisma.user.count({ where: { role: "user" } })
    const activeDeliveryPartners = await prisma.user.count({ where: { role: "deliveryBoy" } }) // or add isOnline: true if schema supports it

    const totalOrders = orders.length

    const pendingDeliveries = orders.filter((o) => o.status === "pending").length
    const activeDeliveries = orders.filter((o) => o.status === "out of delivery").length

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

    const today = new Date()
    const startOfToday = new Date(today)
    startOfToday.setHours(0, 0, 0, 0)

    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= startOfToday)
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

    const recentOrders = orders.slice(0, 10);

    const stats = [
        { title: "Total Orders", value: totalOrders },
        { title: "Active Deliveries", value: activeDeliveries },
        { title: "Pending Deliveries", value: pendingDeliveries },
        { title: "Total Revenue", value: totalRevenue },
        { title: "Total Customers", value: totalCustomers },
    ];

    const chartData = []

    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)

        const filteredOrders = orders.filter((o) => new Date(o.createdAt) >= date && new Date(o.createdAt) < nextDay);
        const ordersCount = filteredOrders.length;
        const revenueForDay = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        // Assuming unique customers for the day by ID
        const uniqueCustomers = new Set(filteredOrders.map(o => o.userId)).size;

        chartData.push({
            day: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
            orders: ordersCount,
            revenue: revenueForDay,
            customers: uniqueCustomers
        })
    }

    return (
        <AdminDashboardClient
            revenueSummary={{
                today: todayRevenue,
                ordersToday: todayOrders.length,
                pendingDeliveries,
                activeDeliveryPartners
            }}
            stats={stats}
            chartData={chartData}
            recentOrders={JSON.parse(JSON.stringify(recentOrders))}
        />
    )
}

export default AdminDashboardPage
