'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, Cell, PieChart, Pie
} from 'recharts'
import { 
    TrendingUp, Users, ShoppingBag, IndianRupee, 
    ArrowUpRight, ArrowDownRight, Package, Loader,
    Calendar
} from 'lucide-react'
import { motion } from 'motion/react'

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/admin/analytics')
                setStats(res.data)
                setLoading(false)
            } catch (error) {
                console.error("Error fetching analytics", error)
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div className="flex items-center justify-center min-h-[600px]"><Loader className="animate-spin text-green-600" /></div>

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className='w-full pb-12'>
            <div className='mb-8'>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" /> Executive Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">Comprehensive overview of your grocery delivery performance.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                {[
                    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm'
                    >
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon size={24} />
                        </div>
                        <p className='text-sm text-gray-500 font-medium'>{stat.label}</p>
                        <h3 className='text-2xl font-bold text-gray-900 mt-1'>{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
                {/* Revenue & Growth Chart */}
                <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm'>
                    <div className='flex items-center justify-between mb-6'>
                        <h3 className='font-bold text-gray-800 flex items-center gap-2'><Calendar size={18} className="text-gray-400" /> Weekly Performance</h3>
                        <div className="flex gap-2 text-[10px] font-bold">
                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">REVENUE</span>
                            <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">ORDERS</span>
                        </div>
                    </div>
                    <div className='h-[300px] w-full'>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.ordersByDay}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`${value}`, '']}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Selling Products */}
                <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm'>
                    <h3 className='font-bold text-gray-800 mb-6 flex items-center gap-2'><ShoppingBag size={18} className="text-gray-400" /> Top Selling Products</h3>
                    <div className='space-y-4'>
                        {stats.topProducts.map((product: any, i: number) => (
                            <div key={i} className='flex items-center justify-between'>
                                <div className='flex items-center gap-4'>
                                    <div className={`w-2 h-8 rounded-full`} style={{ backgroundColor: COLORS[i] }}></div>
                                    <div>
                                        <p className='font-bold text-gray-900 text-sm'>{product.name}</p>
                                        <p className='text-xs text-gray-500'>{product.quantity} items sold</p>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <p className='text-sm font-black text-gray-700'>{((product.quantity / stats.topProducts.reduce((a:any,b:any)=>a+b.quantity, 0)) * 100).toFixed(0)}%</p>
                                    <div className='w-20 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden'>
                                        <div className='h-full' style={{ backgroundColor: COLORS[i], width: `${(product.quantity / stats.topProducts[0].quantity) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {stats.topProducts.length === 0 && <p className="text-gray-400 text-center py-10 italic">No sales data yet.</p>}
                </div>
            </div>
        </div>
    )
}
