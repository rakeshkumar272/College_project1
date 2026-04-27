'use client'
import React, { useState } from 'react'
import { Settings, Save, Bell, Shield, Truck, Clock, IndianRupee } from 'lucide-react'
import { motion } from 'motion/react'

export default function SettingsPage() {
    const [config, setConfig] = useState({
        deliveryFee: 40,
        freeDeliveryOver: 500,
        avgDeliveryTime: 15,
        platformActive: true
    })

    const handleSave = () => {
        alert("Settings saved successfully!")
    }

    return (
        <div className='w-full max-w-4xl'>
            <div className='mb-8'>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="text-gray-600" /> Platform Settings
                </h1>
                <p className="text-sm text-gray-500 mt-1">Configure delivery rules, pricing, and system behavior.</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-12 gap-8'>
                <div className='md:col-span-8 space-y-6'>
                    
                    {/* Delivery Rules */}
                    <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm'>
                        <h3 className='font-bold text-gray-800 mb-6 flex items-center gap-2'><Truck size={18} className="text-green-600" /> Delivery Configuration</h3>
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-semibold text-gray-700'>Base Delivery Fee</p>
                                    <p className='text-xs text-gray-500'>Amount charged for standard delivery</p>
                                </div>
                                <div className='flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100'>
                                    <IndianRupee size={14} className='text-gray-400'/>
                                    <input 
                                        type="number" 
                                        value={config.deliveryFee}
                                        onChange={(e) => setConfig({...config, deliveryFee: Number(e.target.value)})}
                                        className='w-16 bg-transparent outline-none font-bold text-gray-800'
                                    />
                                </div>
                            </div>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-semibold text-gray-700'>Free Delivery Threshold</p>
                                    <p className='text-xs text-gray-500'>Order total required for free delivery</p>
                                </div>
                                <div className='flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100'>
                                    <IndianRupee size={14} className='text-gray-400'/>
                                    <input 
                                        type="number" 
                                        value={config.freeDeliveryOver}
                                        onChange={(e) => setConfig({...config, freeDeliveryOver: Number(e.target.value)})}
                                        className='w-16 bg-transparent outline-none font-bold text-gray-800'
                                    />
                                </div>
                            </div>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-semibold text-gray-700'>Delivery Time Target</p>
                                    <p className='text-xs text-gray-500'>Estimated minutes shown to users</p>
                                </div>
                                <div className='flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100'>
                                    <Clock size={14} className='text-gray-400'/>
                                    <input 
                                        type="number" 
                                        value={config.avgDeliveryTime}
                                        onChange={(e) => setConfig({...config, avgDeliveryTime: Number(e.target.value)})}
                                        className='w-16 bg-transparent outline-none font-bold text-gray-800'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='flex justify-end'>
                        <button 
                            onClick={handleSave}
                            className='flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100'
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>

                </div>

                <div className='md:col-span-4 space-y-6'>
                    <div className='bg-gray-900 text-white p-6 rounded-2xl shadow-xl'>
                        <h3 className='font-bold mb-4 flex items-center gap-2'><Shield size={18} className='text-green-400'/> Security</h3>
                        <p className='text-xs text-gray-400 leading-relaxed'>Manage platform access, API keys, and admin permissions. Changes here take immediate effect.</p>
                        <button className='w-full mt-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all'>Manage Access</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
