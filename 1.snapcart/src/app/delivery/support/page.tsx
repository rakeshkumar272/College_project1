'use client'
import { ArrowLeft, MessageCircle, Phone, Mail, ChevronRight, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function Support() {
    const router = useRouter()
    
    const faqs = [
        "How do I update my vehicle details?",
        "What to do if a customer is unreachable?",
        "When does the payout cycle process?",
        "How do I report an accident on duty?"
    ]

    return (
        <div className='bg-gray-50 min-h-screen w-full pb-10'>
            <div className='bg-white border-b sticky top-0 z-50 shadow-sm'>
                <div className='max-w-3xl mx-auto flex items-center gap-4 px-4 py-4'>
                    <button className='p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition' onClick={() => router.push("/")}>
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Support & Help</h1>
                </div>
            </div>

            <div className='max-w-3xl mx-auto px-4 mt-6'>
                <div className='grid grid-cols-2 gap-4 mb-8 text-center'>
                    <button className='bg-green-600 text-white p-5 rounded-3xl shadow-md hover:bg-green-700 transition flex flex-col items-center justify-center gap-3 active:scale-95'>
                        <MessageCircle size={32} />
                        <span className='font-semibold'>Live Chat</span>
                    </button>
                    <button className='bg-white border border-gray-200 text-gray-800 p-5 rounded-3xl shadow-sm hover:bg-gray-50 transition flex flex-col items-center justify-center gap-3 active:scale-95'>
                        <Phone className='text-blue-600' size={32} />
                        <span className='font-semibold'>Call Fleet Manager</span>
                    </button>
                </div>

                <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6'>
                    <div className='p-4 border-b border-gray-50 bg-gray-50/50'>
                        <h2 className='font-bold text-gray-800 flex items-center gap-2'><HelpCircle size={18} className='text-gray-500'/> Frequently Asked Questions</h2>
                    </div>
                    <div>
                        {faqs.map((faq, i) => (
                            <div key={i} className='p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition'>
                                <span className='text-sm text-gray-700 font-medium'>{faq}</span>
                                <ChevronRight size={16} className='text-gray-400' />
                            </div>
                        ))}
                    </div>
                </div>

                <div className='bg-blue-50 rounded-2xl border border-blue-100 p-6 flex items-start gap-4'>
                    <div className='p-3 bg-blue-100 rounded-full text-blue-600'>
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className='font-bold text-blue-900'>Email Escalations</h3>
                        <p className='text-sm text-blue-700 mt-1 mb-3'>For severe disputes or payment issues, email our finance and safety team directly.</p>
                        <a href="mailto:support@speedymart.com" className='text-sm font-bold text-blue-600 hover:underline'>fleet-support@speedymart.com</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
