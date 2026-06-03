'use client'
import axios from 'axios'
import { ArrowLeft, Clock, MapPin, IndianRupee, Navigation } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

export default function DeliveryHistory() {
    const router = useRouter()
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('/api/delivery/get-history')
                setHistory(res.data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    return (
        <div className='bg-gray-50 min-h-screen w-full pb-10'>
            <div className='bg-white border-b sticky top-0 z-50 shadow-sm'>
                <div className='max-w-3xl mx-auto flex items-center gap-4 px-4 py-4'>
                    <button className='p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition' onClick={() => router.push("/")}>
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Delivery History</h1>
                </div>
            </div>

            <div className='max-w-3xl mx-auto px-4 mt-6'>
                {loading ? (
                    <div className='flex justify-center mt-20'><div className='animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full'></div></div>
                ) : history.length === 0 ? (
                    <div className='text-center mt-20 text-gray-500'>
                        <Clock size={48} className='mx-auto mb-4 text-gray-300' />
                        <h2 className='text-lg font-semibold text-gray-700'>No Deliveries Yet</h2>
                        <p>You haven't completed any deliveries.</p>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {history.map((order, i) => (
                            <div key={i} className='bg-white p-5 rounded-2xl border border-gray-100 shadow-sm'>
                                <div className='flex justify-between items-start mb-3'>
                                    <div>
                                        <p className='text-sm text-gray-500 font-medium'>Order #{order.orderNumber || order.id?.slice(-6) || order._id?.slice(-6)}</p>
                                        <p className='text-xs text-gray-400 mt-0.5'>{new Date(order.deliveredAt).toLocaleString()}</p>
                                    </div>
                                    <span className='px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full'>Completed</span>
                                </div>
                                
                                <div className='flex items-start gap-3 mt-4 mb-4 bg-gray-50 p-3 rounded-xl'>
                                    <MapPin className='text-green-600 mt-0.5 min-w-5' size={18} />
                                    <p className='text-sm text-gray-700 line-clamp-2'>{order.addressFullAddress}</p>
                                </div>

                                <div className='flex items-center justify-between border-t border-dashed border-gray-200 pt-4'>
                                    <div className='flex items-center gap-2 text-gray-600'>
                                        <Navigation size={16} />
                                        <span className='text-sm font-medium'>4.2 km</span>
                                    </div>
                                    <div className='flex items-center gap-1 text-gray-800 font-bold'>
                                        <IndianRupee size={18} />
                                        <span>40.00</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
