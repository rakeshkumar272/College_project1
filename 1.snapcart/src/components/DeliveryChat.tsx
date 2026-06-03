import { getSocket } from '@/lib/socket'
import axios from 'axios'
import { Loader, Loader2, Send, Sparkle } from 'lucide-react'

import { AnimatePresence } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from "motion/react"
type props = {
  orderId: string,
  deliveryBoyId: string
}

function DeliveryChat({ orderId, deliveryBoyId }: props) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<any[]>()
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const deliveryBoyIdRef = useRef(deliveryBoyId)

  useEffect(() => {
    deliveryBoyIdRef.current = deliveryBoyId
  }, [deliveryBoyId])
  useEffect(() => {
    const socket = getSocket()
    socket.emit("join-room", orderId)
    socket.on("send-message", (message) => {
      if (message.roomId === orderId && message.senderId !== deliveryBoyIdRef.current) {
        setMessages((prev) => {
          if (prev?.some(m => m.text === message.text && m.senderId === message.senderId)) return prev;
          return [...(prev || []), message]
        })
      }

    })

    return () => {
      socket.off("send-message")
    }

  }, [])

  const sendMsg = () => {
    const socket = getSocket()

    const message = {
      roomId: orderId,
      text: newMessage,
      senderId: deliveryBoyId,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    }
    setMessages((prev) => [...(prev || []), { ...message, id: Date.now().toString() }])
    socket.emit("send-message", message)

    setNewMessage("")
  }

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth"
    })
  }, [messages])

  useEffect(() => {
    const getAllMessages = async () => {
      try {
        const result = await axios.post("/api/chat/messages", { roomId: orderId })
        setMessages(result.data)
      } catch (error) {
        console.log(error)
      }
    }
    getAllMessages()
  }, [])

  const getSuggestion = async () => {
    setLoading(true)
    try {

      const lastMessage = messages?.filter(m => m.senderId?.toString() !== deliveryBoyId)?.at(-1)
      const result = await axios.post("/api/chat/ai-suggestions", { message: lastMessage?.text, role: "delivery_boy" })
      setSuggestions(result.data)
      setLoading(false)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }


  return (
    <div className='flex flex-col h-[480px] w-full bg-white'>

      {/* Header */}
      <div className='px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shadow-sm'>
        <div>
          <h3 className='font-bold text-gray-800 flex items-center gap-2'>Chat with Customer</h3>
          <p className='text-xs text-green-600 font-medium flex items-center gap-1.5'><span className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse'></span>Online</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          disabled={loading}
          onClick={getSuggestion}
          className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
        >
          <Sparkle size={14} />{loading ? <Loader className="w-4 h-4 animate-spin" /> : "AI Suggestion"}
        </motion.button>
      </div>

      {/* Message Area */}
      <div className='flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50' ref={chatBoxRef}>
        <div className='text-center text-[10px] uppercase font-bold text-gray-400 my-2 tracking-widest'>Today</div>
        <AnimatePresence>
          {messages?.map((msg, index) => {
            const isMe = msg.senderId?.toString() == deliveryBoyId;
            return (
              <motion.div
                key={msg.id?.toString() || msg._id?.toString() || index}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className={`px-4 py-2.5 max-w-[85%] rounded-2xl shadow-sm md:text-[15px] text-sm ${isMe
                    ? "bg-green-600 text-white rounded-br-sm shadow-green-600/20"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                  }`}>
                  <p className='leading-snug'>{msg.text}</p>
                </div>
                <p className='text-[10px] text-gray-400 mt-1.5 font-medium px-1 flex items-center gap-1'>
                  {msg.time}
                </p>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className='p-4 bg-white border-t border-gray-100 z-10'>
        {/* Quick Suggestions */}
        {suggestions.length > 0 && (
          <div className='flex gap-2 overflow-x-auto pb-3 scrollbar-hide'>
            {suggestions.map((s, i) => (
              <motion.div
                key={s}
                whileTap={{ scale: 0.95 }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full cursor-pointer whitespace-nowrap transition-colors"
                onClick={() => { setNewMessage(s); setSuggestions([]); }}
              >
                {s}
              </motion.div>
            ))}
          </div>
        )}

        <div className='flex items-center gap-2 bg-gray-50 rounded-full border border-gray-200 p-1.5 pl-4 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all'>
          <input
            type="text"
            placeholder='Type your message...'
            className='flex-1 bg-transparent outline-none text-[15px] text-gray-700 font-medium placeholder:text-gray-400 placeholder:font-normal'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && newMessage.trim() && sendMsg()}
          />
          <button
            disabled={!newMessage.trim()}
            className={`p-2.5 rounded-full tracking-tight transition-all ${newMessage.trim() ? 'bg-green-600 text-white shadow-md shadow-green-200 hover:bg-green-700 hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 pointer-events-none'}`}
            onClick={sendMsg}
          >
            <Send size={16} className={newMessage.trim() ? 'translate-x-[1px]' : ''} />
          </button>
        </div>
      </div>

    </div>
  )
}

export default DeliveryChat
