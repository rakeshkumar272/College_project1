'use client';
import React, { useState } from 'react';
import { motion } from "motion/react";
import { IndianRupee, Package, Truck, Users, Clock, ArrowRight, PackagePlus, ClipboardList, BoxSelect, BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Link from 'next/link';

type Order = {
  id?: string;
  _id?: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  user?: { name: string };
};

type propType = {
  revenueSummary: {
    today: number;
    ordersToday: number;
    pendingDeliveries: number;
    activeDeliveryPartners: number;
  },
  stats: {
    title: string;
    value: number;
  }[],
  chartData: {
    day: string;
    orders: number;
    revenue: number;
    customers: number;
  }[],
  recentOrders: Order[]
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'out of delivery': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function AdminDashboardClient({ revenueSummary, stats, chartData, recentOrders }: propType) {
  const [chartFilter, setChartFilter] = useState<'orders' | 'revenue' | 'customers'>('orders');

  const icons = [
    <Package key="p" className="text-green-700 w-6 h-6" />,
    <Truck key="t1" className="text-green-700 w-6 h-6" />,
    <Clock key="c" className="text-green-700 w-6 h-6" />,
    <IndianRupee key="r" className="text-green-700 w-6 h-6" />,
    <Users key="u" className="text-green-700 w-6 h-6" />
  ];

  const hasChartData = chartData.some(d => d[chartFilter] > 0);

  return (
    <div className='flex flex-col gap-6 w-full'>

      {/* Header section is removed since layout handles it */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Here's what's happening with your store today.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-gray-100 shadow-xs rounded-xl p-5 flex flex-col justify-between gap-3 hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <p className="text-gray-500 text-sm font-medium">{s.title}</p>
              <div className='bg-green-50 p-2 rounded-lg'>
                {icons[i]}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.title.includes('Revenue') ? '₹' : ''}{s.value.toLocaleString()}</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-green-400 to-green-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Summary and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Summary Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-600 text-white rounded-2xl shadow-md p-6 lg:col-span-1 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 opacity-10 scale-150 transform translate-x-10 -translate-y-10 pointer-events-none">
            <IndianRupee size={150} />
          </div>

          <div>
            <p className="text-green-100 text-sm font-medium mb-1">Today's Revenue</p>
            <h2 className="text-4xl font-extrabold mb-6">₹{revenueSummary.today.toLocaleString()}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 gap-y-6">
            <div>
              <p className="text-green-200 text-xs uppercase tracking-wider font-semibold">Orders Today</p>
              <p className="text-2xl font-bold mt-1">{revenueSummary.ordersToday}</p>
            </div>
            <div>
              <p className="text-green-200 text-xs uppercase tracking-wider font-semibold">Active Partners</p>
              <p className="text-2xl font-bold mt-1">{revenueSummary.activeDeliveryPartners}</p>
            </div>
            <div>
              <p className="text-green-200 text-xs uppercase tracking-wider font-semibold">Pending Del.</p>
              <p className="text-2xl font-bold mt-1 text-yellow-300">{revenueSummary.pendingDeliveries}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { title: "Add Product", icon: PackagePlus, href: "/admin/products/add", color: "bg-blue-50 text-blue-600" },
            { title: "Manage Orders", icon: ClipboardList, href: "/admin/orders", color: "bg-purple-50 text-purple-600" },
            { title: "View Customers", icon: Users, href: "/admin/customers", color: "bg-orange-50 text-orange-600" },
            { title: "Inventory", icon: BoxSelect, href: "/admin/products", color: "bg-emerald-50 text-emerald-600" },
          ].map((action, idx) => (
            <Link href={action.href} key={idx} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-center shadow-xs hover:shadow-md hover:border-gray-200 transition-all group">
              <div className={`p-3 rounded-full \${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Analytics Chart */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-xs p-6'>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className='text-lg font-semibold text-gray-800'>Analytics (Last 7 Days)</h2>
            <p className="text-sm text-gray-500">View your store's performance metrics.</p>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['orders', 'revenue', 'customers'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setChartFilter(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors \${chartFilter === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {!hasChartData ? (
          <div className="h-[300px] flex items-center justify-center flex-col text-gray-400">
            <BarChart3 size={48} className="mb-4 text-gray-300" />
            <p>No {chartFilter} recorded in the last 7 days.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar
                dataKey={chartFilter}
                fill={chartFilter === 'revenue' ? '#10B981' : chartFilter === 'customers' ? '#6366F1' : '#3B82F6'}
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            <p className="text-sm text-gray-500">Latest 10 orders placed.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id || order._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{((order.id || order._id) as string).slice(-6)}</td>
                    <td className="px-6 py-4 text-gray-600">{order.user?.name || 'Guest'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">₹{order.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium border rounded-full \${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/orders`} className="text-green-600 hover:text-green-800 font-medium hover:underline inline-flex items-center gap-1">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-center">
          <Link href="/admin/orders" className="text-sm font-medium text-green-700 hover:text-green-800 inline-flex items-center gap-1">
            View All Orders <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
