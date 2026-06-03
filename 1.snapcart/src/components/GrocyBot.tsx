'use client'
import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'

export default function GrocyBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hi! I am GrocyBot, your SnapCart assistant. How can I help you today? 🛒' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg = { role: 'user', text: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await axios.post('/api/chatbot', { message: input, history: messages })
            setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-[60]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-[350px] sm:w-[400px] h-[500px] flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="bg-green-600 p-4 text-white flex justify-between items-center shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold">GrocyBot</h3>
                                    <p className="text-[10px] text-green-100 uppercase tracking-widest font-bold">AI Support Active</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
                            {messages.map((msg, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i} 
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm transition-all ${
                                        msg.role === 'user' 
                                        ? 'bg-green-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-green-600" />
                                        <span className="text-xs text-gray-400 font-medium tracking-tight">GrocyBot is typing...</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="relative flex items-center gap-2">
                                <input
                                    autoFocus
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="absolute right-2 p-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center mt-3 font-medium flex items-center justify-center gap-1">
                                Powered by Gemini AI <Sparkles size={10} className="text-purple-400" />
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
                    isOpen ? 'bg-white text-green-600 border border-gray-100' : 'bg-green-600 text-white'
                }`}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>
        </div>
    )
}
