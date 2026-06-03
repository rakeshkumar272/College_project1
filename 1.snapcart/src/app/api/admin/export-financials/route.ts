import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session || session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }
        const orders = await prisma.order.findMany({
            include: {
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        let totalOrdersCount = 0;
        let totalInflow = 0;
        let totalOutflow = 0;
        let totalGoodsCost = 0;

        const rows = orders.map(order => {
            const goodsCost = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
            const inflow = order.totalAmount;
            const outflow = 40; // Delivery fee paid to the agent is Rs 40 per order
            const profit = inflow - outflow - goodsCost;

            totalOrdersCount++;
            totalInflow += inflow;
            totalOutflow += outflow;
            totalGoodsCost += goodsCost;

            return {
                orderId: order.id,
                date: order.createdAt.toISOString(),
                inflow: inflow.toFixed(2),
                outflow: outflow.toFixed(2),
                goodsCost: goodsCost.toFixed(2),
                profit: profit.toFixed(2)
            };
        });

        const totalProfit = totalInflow - totalOutflow - totalGoodsCost;

        // Build CSV string
        let csvContent = "Financial Metrics Summary\n";
        csvContent += `Total Orders Received,${totalOrdersCount}\n`;
        csvContent += `Total Cash Inflow,${totalInflow.toFixed(2)}\n`;
        csvContent += `Total Cash Outflow,${totalOutflow.toFixed(2)}\n`;
        csvContent += `Total Revenue Used in Goods,${totalGoodsCost.toFixed(2)}\n`;
        csvContent += `Total Profit,${totalProfit.toFixed(2)}\n\n`;

        csvContent += "Order ID,Date of Order,Inflow Amount (Revenue),Outflow Amount (Refunds/Fees),Goods Cost (Revenue used in goods),Order Profit\n";
        
        rows.forEach(row => {
            csvContent += `${row.orderId},${row.date},${row.inflow},${row.outflow},${row.goodsCost},${row.profit}\n`;
        });

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": "attachment; filename=financials_export.csv",
            }
        });
    } catch (error) {
        console.error("Export Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
