import { auth } from "@/auth";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
        }

        const [orders, users, groceries] = await Promise.all([
            prisma.order.findMany({
                include: { items: true }
            }),
            prisma.user.count(),
            prisma.grocery.findMany()
        ]);

        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        
        // Orders per day (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const ordersByDay = last7Days.map(day => ({
            day,
            count: orders.filter(o => o.createdAt.toISOString().split('T')[0] === day).length,
            revenue: orders.filter(o => o.createdAt.toISOString().split('T')[0] === day).reduce((acc, o) => acc + o.totalAmount, 0)
        }));

        // Top selling products
        const productSales: Record<string, { name: string, quantity: number }> = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!productSales[item.groceryId]) {
                    productSales[item.groceryId] = { name: item.name, quantity: 0 };
                }
                productSales[item.groceryId].quantity += item.quantity;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return NextResponse.json({
            totalRevenue,
            totalOrders: orders.length,
            totalUsers: users,
            totalProducts: groceries.length,
            ordersByDay,
            topProducts
        }, { status: 200 });

    } catch (error) {
        console.error("Get analytics error:", error);
        return NextResponse.json({ message: `Internal Server Error: ${error}` }, { status: 500 });
    }
}
