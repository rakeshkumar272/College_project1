'use client'
import AdminOrderCard from '@/components/AdminOrderCard'
import { getSocket } from '@/lib/socket'

import axios from 'axios'
import { ArrowLeft, Download } from 'lucide-react'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
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
  orderNumber?: number
  status: "pending" | "out of delivery" | "delivered",
  createdAt?: Date
  updatedAt?: Date
}
function ManageOrders() {
  const [orders, setOrders] = useState<IOrder[]>()
  const router = useRouter()
  useEffect(() => {
    const getOrders = async () => {
      try {
        const result = await axios.get("/api/admin/get-orders")
        setOrders(result.data)
      } catch (error) {
        console.log(error)
      }
    }
    getOrders()
  }, [])


  useEffect(() => {
    const socket = getSocket()
    socket?.on("new-order", (newOrder) => {
      setOrders((prev) => [newOrder, ...prev!])
    })
    socket.on("order-assigned", ({ orderId, assignedDeliveryBoy }) => {
      setOrders((prev) => prev?.map((o) => (
        (o.id || o._id) == orderId ? { ...o, assignedDeliveryBoy } : o
      )))
    })
    return () => {
      socket.off("new-order")
      socket.off("order-assigned")

    }
  }, [])

  const handleExport = () => {
    window.location.href = '/api/admin/export-financials';
  }

  return (
    <div className='w-full'>
      <div className='mb-6 flex justify-between items-center'>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Orders</h1>
          <p className="text-sm text-gray-500 mt-1">View and update customer orders.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Download size={18} /> Export Financials
        </button>
      </div>
      <div className='space-y-6'>
        <div className='space-y-6'>
          {orders?.map((order, index) => (
            <AdminOrderCard key={index} order={order} />
          ))}
        </div>
      </div>

    </div>
  )
}

export default ManageOrders
