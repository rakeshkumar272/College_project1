'use client'
import { getSocket } from '@/lib/socket'
import { RootState } from '@/redux/store'
import axios from 'axios'
import { ArrowLeft, Loader, Send, Sparkle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from "motion/react"
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })

interface IOrder {
  id?: string
  _id?: string
  user: string
  items: [
    {
      grocery: string,
      name: string,
      price: string,
      unit: string,
      image: string
      quantity: number
    }
  ]
  ,
  isPaid: boolean
  totalAmount: number,
  paymentMethod: "cod" | "online"
  address: {
    fullName: string,
    mobile: string,
    city: string,
    state: string,
    pincode: string,
    fullAddress: string,
    latitude: number,
    longitude: number
  }
  assignment?: string
  assignedDeliveryBoy?: any
  status: "pending" | "out of delivery" | "delivered",
  orderNumber?: number,
  createdAt?: Date
  updatedAt?: Date
}
interface ILocation {
  latitude: number,
  longitude: number
}
function TrackOrder({ params }: { params: { orderId: string } }) {
  const { userData } = useSelector((state: RootState) => state.user)
  const { orderId } = useParams()
  const [order, setOrder] = useState<IOrder>()
  const router = useRouter()
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<any[]>()
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [userLocation, setUserLocation] = useState<ILocation>(
    {
      latitude: 0,
      longitude: 0
    }
  )
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0
  })

  const [eta, setEta] = useState("Calculating...")
  const userDataRef = useRef(userData)
  
  useEffect(() => {
    userDataRef.current = userData
  }, [userData])

  const fetchLiveLocation = async () => {
    try {
      const res = await axios.get(`/api/order/live-location/${orderId}`)
      if (res.data.deliveryBoy) {
        setDeliveryBoyLocation({
          latitude: res.data.deliveryBoy.latitude,
          longitude: res.data.deliveryBoy.longitude
        })
      }
      if (res.data.customerLocation) {
        setUserLocation({
          latitude: res.data.customerLocation.latitude,
          longitude: res.data.customerLocation.longitude
        })
      }
      if (res.data.eta) setEta(res.data.eta)
    } catch (error) {
      console.error("Error fetching live location:", error)
    }
  }

  useEffect(() => {
    const getOrder = async () => {
      try {
        const result = await axios.get(`/api/user/get-order/${orderId}`)
        setOrder(result.data)
        // Initial setup
        fetchLiveLocation()
      } catch (error) {
        console.log(error)
      }
    }
    getOrder()

    // Setup polling for live location (every 5 seconds)
    const interval = setInterval(fetchLiveLocation, 5000)
    return () => clearInterval(interval)
  }, [orderId])

  useEffect((): any => {
    const socket = getSocket()
    socket.on("update-deliveryBoy-location", (data) => {
      // Immediate socket fallback if active
      setDeliveryBoyLocation({
        latitude: data.latitude,
        longitude: data.longitude,
      })
    })
    return () => socket.off("update-deliveryBoy-location")
  }, [])

  useEffect(() => {
    const socket = getSocket()
    socket.emit("join-room", orderId)
    socket.on("send-message", (message) => {
      const currentUserId = userDataRef.current?.id || userDataRef.current?._id;
      if (message.roomId === orderId && message.senderId !== currentUserId) {
        setMessages((prev) => {
          // Prevent duplicates if already added optimistically
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
    if (!newMessage.trim()) return
    const socket = getSocket()

    const message = {
      roomId: orderId,
      text: newMessage.trim(),
      senderId: (userData?.id || userData?._id),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    }
    
    // Optimistic update
    setMessages((prev) => [...(prev || []), { ...message, id: Date.now().toString() }])
    
    socket.emit("send-message", message)
    setNewMessage("")
  }
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

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth"
    })
  }, [messages])

  const getSuggestion = async () => {
    setLoading(true)
    try {

      const lastMessage = messages?.filter(m => m.senderId?.toString() !== (userData?.id || userData?._id))?.at(-1)
      const result = await axios.post("/api/chat/ai-suggestions", { message: lastMessage?.text, role: "user" })
      setSuggestions(result.data)
      setLoading(false)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  return (
    <div className='w-full min-h-screen bg-linear-to-b from-green-50 to-white'>
      <div className='max-w-2xl mx-auto pb-24'>
        <div className='sticky top-0 bg-white/80 backdrop-blur-xl p-4 border-b shadow flex gap-3 items-center z-999'>
          <button className='p-2 bg-green-100 rounded-full' onClick={() => router.back()}><ArrowLeft className="text-green-700" size={20} /></button>
          <div>
            <h2 className='text-xl font-bold'>Track Order</h2>
            <p className='text-sm text-gray-600'>Order <span className='font-bold'>#{order?.orderNumber || order?._id?.toString().slice(-6)}</span> <span className='text-green-700 font-semibold'>{order?.status}</span> • <span className='text-blue-600 font-bold'>Arriving in {eta}</span></p>
          </div>

        </div>
        <div className='px-4 mt-6 space-y-4'>
          <div className='rounded-3xl overflow-hidden border shadow'>
            <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
          </div>

          <div className='bg-white rounded-3xl shadow-lg border p-4 h-[430px] flex flex-col'>

            <div className='flex justify-between items-center mb-3'>
              <span className='font-semibold text-gray-700 text-sm'>Quick Replies</span>
              <motion.button
                disabled={loading}
                whileTap={{ scale: 0.9 }}
                className="px-3 py-1 text-xs flex items-center gap-1 bg-purple-100 text-purple-700 rounded-full shadow-sm border border-purple-200 cursor-pointer"
                onClick={getSuggestion}
              ><Sparkle size={14} />{loading ? <Loader className="w-5 h-5 animate-spin" /> : "AI suggest"}</motion.button>
            </div>

            <div className='flex gap-2 flex-wrap mb-3'>
              {suggestions.map((s, i) => (
                <motion.div
                  key={s}
                  whileTap={{ scale: 0.92 }}
                  className="px-3 py-1 text-xs bg-green-50 border border-green-200 cursor-pointer text-green-700 rounded-full"
                  onClick={() => setNewMessage(s)}
                >
                  {s}
                </motion.div>
              ))}
            </div>

            <div className='flex-1 overflow-y-auto p-2 space-y-3' ref={chatBoxRef}>
              <AnimatePresence>
                {messages?.map((msg, index) => (
                  <motion.div
                    key={msg.id?.toString() || msg._id?.toString() || index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.senderId?.toString() == (userData?.id || userData?._id) ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`px-4 py-2 max-w-[75%] rounded-2xl shadow 
                  ${msg.senderId?.toString() === (userData?.id || userData?._id)
                        ? "bg-green-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}>
                      <p >{msg.text}</p>
                      <p className='text-[10px] opacity-70 mt-1 text-right'>{msg.time}</p>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </div>


            <div className='flex gap-2 mt-3 border-t pt-3'>
              <input type="text" placeholder='Type a Message...' className='flex-1 bg-gray-100 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500' value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
              <button className='bg-green-600 hover:bg-green-700 p-3 rounded-xl text-white' onClick={sendMsg}><Send size={18} /></button>
            </div>

          </div>




        </div>
      </div>
    </div>
  )
}

export default TrackOrder
