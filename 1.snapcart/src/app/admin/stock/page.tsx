'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { Package, Search, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Image from 'next/image'

export default function StockMonitoring() {
    const [groceries, setGroceries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    const getStockData = async () => {
        setLoading(true)
        try {
            const result = await axios.get("/api/admin/get-groceries")
            if (Array.isArray(result.data)) {
                setGroceries(result.data)
            } else {
                console.error("API did not return an array", result.data)
            }
        } catch (error) {
            console.error("Error fetching stock data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getStockData()
    }, [])

    const allVariants = groceries.flatMap(g => 
        (g.variants || []).map((v: any) => ({
            ...v,
            productName: g.name,
            productImage: g.image,
            category: g.category
        }))
    ).filter(v => 
        v.productName.toLowerCase().includes(search.toLowerCase()) || 
        v.category.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "OUT_OF_STOCK": return { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Out of Stock" }
            case "LOW_STOCK": return { bg: "bg-yellow-100", text: "text-yellow-700", icon: AlertTriangle, label: "Low Stock" }
            default: return { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "In Stock" }
        }
    }

    return (
        <div className="w-full max-w-6xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
                        <Package size={28} className='text-blue-600' /> Stock Monitoring
                    </h1>
                    <p className="text-gray-500 text-sm">Track inventory levels and availability across all variants.</p>
                </div>
                <button 
                    onClick={getStockData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50">
                    <Search className="text-gray-400 w-5 h-5 mr-3" />
                    <input 
                        type="text" 
                        placeholder="Search products or categories..." 
                        className="bg-transparent outline-none w-full text-sm text-gray-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Variant (Weight)</th>
                                <th className="px-6 py-4">Current Stock</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-40 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded"></div></td>
                                    </tr>
                                ))
                            ) : allVariants.length > 0 ? (
                                allVariants.map((v, i) => {
                                    const status = getStatusStyles(v.stockStatus);
                                    return (
                                        <motion.tr 
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 relative rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                                        <Image 
                                                            src={v.productImage || "/images/fallback.png"} 
                                                            alt={v.productName} 
                                                            fill 
                                                            unoptimized={true}
                                                            className="object-cover" 
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                if(target.src !== "/images/fallback.png") {
                                                                    target.src = "/images/fallback.png";
                                                                    target.srcset = "";
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm">{v.productName}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{v.category}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                                    {v.weightInGrams}g
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold \${v.stockQuantity <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {v.stockQuantity}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">units</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full \${status.bg} \${status.text} text-[10px] font-bold uppercase`}>
                                                    <status.icon size={12} />
                                                    {status.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-gray-800">₹{v.price}</span>
                                            </td>
                                        </motion.tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">
                                        No variants found. Add products to see stock data.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-50 border border-red-100 p-5 rounded-2xl">
                    <h3 className="text-red-800 font-bold text-sm mb-1">Out of Stock</h3>
                    <p className="text-3xl font-extrabold text-red-600">
                        {allVariants.filter(v => v.stockStatus === 'OUT_OF_STOCK').length}
                    </p>
                    <p className="text-xs text-red-500 mt-2">Variants requiring immediate restock.</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl">
                    <h3 className="text-yellow-800 font-bold text-sm mb-1">Low Stock</h3>
                    <p className="text-3xl font-extrabold text-yellow-600">
                        {allVariants.filter(v => v.stockStatus === 'LOW_STOCK').length}
                    </p>
                    <p className="text-xs text-yellow-500 mt-2">Variants with less than 5 items left.</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-5 rounded-2xl">
                    <h3 className="text-green-800 font-bold text-sm mb-1">Healthy Stock</h3>
                    <p className="text-3xl font-extrabold text-green-600">
                        {allVariants.filter(v => v.stockStatus === 'IN_STOCK').length}
                    </p>
                    <p className="text-xs text-green-500 mt-2">Variants with sufficient inventory.</p>
                </div>
            </div>
        </div>
    )
}
