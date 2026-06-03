'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Bike, Package, Navigation, Loader, RefreshCw, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })

export default function DeliveriesPage() {
    const [deliveries, setDeliveries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null)

    const fetchDeliveries = async () => {
        try {
            const res = await axios.get('/api/admin/deliveries')
            setDeliveries(res.data)
            setLoading(false)
        } catch (error) {
            console.error("Error fetching deliveries", error)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDeliveries()
        const interval = setInterval(fetchDeliveries, 15000) // Refresh every 15s
        return () => clearInterval(interval)
    }, [])

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="animate-spin text-green-600" /></div>

    return (
        <div className='w-full'>
            <div className='mb-6 flex justify-between items-center'>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Live Deliveries</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor active trips and delivery partner locations in real-time.</p>
                </div>
                <button 
                    onClick={fetchDeliveries}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Refresh Data"
                >
                    <RefreshCw size={18} className="text-gray-600" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* List of Active Deliveries */}
                <div className="lg:col-span-4 space-y-4 max-h-[700px] overflow-y-auto pr-2">
                    {deliveries.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center">
                            <p className="text-gray-500 text-sm">No active deliveries at the moment.</p>
                        </div>
                    ) : (
                        deliveries.map((delivery) => (
                            <motion.div
                                key={delivery.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setSelectedDelivery(delivery)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    selectedDelivery?.id === delivery.id 
                                    ? 'bg-green-50 border-green-200 shadow-md' 
                                    : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        ID: {delivery.order.orderNumber || delivery.order.id.slice(-6)}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        delivery.status === 'assigned' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {delivery.status}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm">{delivery.assignedTo?.name || "Unassigned"}</h3>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <Navigation size={12} />
                                    <span className="truncate">{delivery.order.addressFullAddress || "N/A"}</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Live Map / Detail View */}
                <div className="lg:col-span-8">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                        {selectedDelivery ? (
                            <>
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                                            {selectedDelivery.assignedTo?.name?.[0] || "P"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-none">{selectedDelivery.assignedTo?.name}</p>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Smartphone size={10}/> {selectedDelivery.assignedTo?.mobile || "N/A"}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedDelivery(null)} className="text-gray-400 hover:text-gray-600 text-xs font-medium px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-xs">View All Partners</button>
                                </div>
                                <div className="flex-1 relative">
                                    <LiveMap 
                                        userLocation={{ 
                                            latitude: selectedDelivery.order.addressLatitude, 
                                            longitude: selectedDelivery.order.addressLongitude 
                                        }} 
                                        deliveryBoyLocation={{ 
                                            latitude: selectedDelivery.assignedTo?.latitude || 0, 
                                            longitude: selectedDelivery.assignedTo?.longitude || 0 
                                        }} 
                                        height="600px" 
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
                                <div className="w-20 h-20 rounded-full bg-green-50 text-green-200 flex items-center justify-center mb-6">
                                    <Bike size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-300">Select a trip to track live</h3>
                                <p className="text-gray-400 max-w-xs mt-2 text-sm italic">Detailed partner location and customer route will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
