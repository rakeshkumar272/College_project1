import React from 'react';
import prisma from '@/lib/db';
import { Star } from 'lucide-react';

export default async function CustomersPage() {
    const customersData = await prisma.user.findMany({
        where: { role: 'user' },
        include: {
            orders: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const customers = customersData.map(customer => {
        const calculatedTotalOrders = customer.orders.length;
        const calculatedTotalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        return {
            ...customer,
            totalOrders: calculatedTotalOrders > 0 ? calculatedTotalOrders : customer.totalOrders,
            totalSpent: calculatedTotalSpent > 0 ? calculatedTotalSpent : customer.totalSpent
        };
    });

    return (
        <div className='w-full'>
            <div className='mb-6'>
                <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your customer base.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600">Name</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Email / Phone</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Orders</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Total Spent</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    <div className="flex items-center gap-2">
                                        {customer.name}
                                        {customer.isTopBuyer && (
                                            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                <Star size={12} fill="currentColor" /> Top Buyer
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    <div>{customer.email}</div>
                                    <div className="text-xs text-gray-400">{customer.mobile}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-800 font-medium">{customer.totalOrders}</td>
                                <td className="px-6 py-4 text-green-700 font-bold">₹{(customer.totalSpent || 0).toFixed(2)}</td>
                                <td className="px-6 py-4 text-gray-600 text-sm">{customer.createdAt.toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
