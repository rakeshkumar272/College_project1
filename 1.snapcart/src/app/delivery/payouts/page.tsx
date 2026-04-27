'use client'
import axios from 'axios'
import { ArrowLeft, IndianRupee, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

export default function Payouts() {
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

    const totalEarnings = history.length * 40;
    const pendingPayout = history.length > 0 ? history.slice(0, Math.min(5, history.length)).length * 40 : 0; 

    return (
        <div className='bg-gray-50 min-h-screen w-full pb-10'>
            <div className='bg-green-700 border-b sticky top-0 z-50 shadow-sm'>
                <div className='max-w-3xl mx-auto flex items-center gap-4 px-4 py-4'>
                    <button className='p-2 bg-green-600 rounded-full hover:bg-green-500 transition text-white' onClick={() => router.push("/")}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Payouts & Earnings</h1>
                </div>
            </div>

            <div className='max-w-3xl mx-auto px-4 mt-6'>
                {loading ? (
                    <div className='flex justify-center mt-20'><div className='animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full'></div></div>
                ) : (
                    <>
                        <div className='bg-gray-900 rounded-3xl p-6 shadow-xl relative overflow-hidden mb-8 mt-2'>
                            <div className='absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full blur-[80px] opacity-20'></div>
                            <div className='relative z-10'>
                                <p className='text-gray-400 text-sm font-medium mb-1'>Lifetime Earnings</p>
                                <h3 className='text-4xl font-bold text-white mb-6 flex items-center'><IndianRupee size={32} />{totalEarnings}</h3>
                                
                                <div className='grid grid-cols-2 gap-4'>
                                    <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
                                        <p className='text-gray-400 text-xs mb-1'>Pending Payout</p>
                                        <p className='text-white font-bold text-lg flex items-center'><IndianRupee size={16}/>{pendingPayout}</p>
                                    </div>
                                    <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
                                        <p className='text-gray-400 text-xs mb-1'>Last Payout</p>
                                        <p className='text-white font-bold text-lg'>2 Days Ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className='text-lg font-bold text-gray-800 mb-4 px-1'>Recent Deposits</h2>
                        <div className='space-y-3'>
                            {[1,2,3].map((_, i) => (
                                <div key={i} className='bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between'>
                                    <div className='flex items-center gap-4'>
                                        <div className='w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center'>
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <p className='font-bold text-gray-800'>Bank Transfer</p>
                                            <p className='text-xs text-gray-500 flex items-center gap-1'><Calendar size={12}/> {new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className='text-right'>
                                        <p className='font-bold text-green-600 flex items-center justify-end font-mono'><IndianRupee size={14}/>{history.length > 0 ? 400 : 0}</p>
                                        <p className='text-xs font-semibold text-gray-400 flex items-center gap-1 justify-end'>Processed <ArrowRight size={12}/></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
