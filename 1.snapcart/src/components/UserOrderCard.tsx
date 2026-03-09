'use client'

import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { ChevronDown, ChevronUp, CreditCard, MapPin, Package, Truck, UserCheck } from 'lucide-react'
import { div } from 'motion/react-client'
import Image from 'next/image'
import { getSocket } from '@/lib/socket'
import { useRouter } from 'next/navigation'
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
    addressFullName?: string,
    addressMobile?: string,
    addressCity?: string,
    addressState?: string,
    addressPincode?: string,
    addressFullAddress?: string,
    addressLatitude?: number,
    addressLongitude?: number,
    assignment?: string
    assignedDeliveryBoy?: any
    status: "pending" | "out of delivery" | "delivered" | "canceled",
    createdAt?: Date
    updatedAt?: Date
}
function UserOrderCard({ order }: { order: IOrder }) {
    const [expanded, setExpanded] = useState(false)
    const [status, setStatus] = useState(order.status)
    const router = useRouter()
    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700 border-yellow-300"
            case "out of delivery":
                return "bg-blue-100 text-blue-700 border-blue-300"
            case "delivered":
                return "bg-green-100 text-green-700 border-green-300"
            default:
                return "bg-gray-100 text-gray-600 border-gray-300"
        }
    }

    useEffect((): any => {
        const socket = getSocket()
        socket.on("order-status-update", (data) => {
            if (data.orderId.toString() == order?._id!.toString()) {
                setStatus(data.status)
            }
        })
        return () => socket.off("order-status-update")
    }, [])

    const [cancelTimeLeft, setCancelTimeLeft] = useState(0)
    const [modifyTimeLeft, setModifyTimeLeft] = useState(0)
    const [isCancelling, setIsCancelling] = useState(false)

    useEffect(() => {
        if (!order.createdAt || status !== "pending") return;

        const createdTime = new Date(order.createdAt).getTime();

        const updateTimers = () => {
            const now = new Date().getTime();
            const timeDiff = Math.floor((now - createdTime) / 1000); // seconds passed

            const cancelWindow = 60; // 1 minute
            const modifyWindow = 120; // 2 minutes

            setCancelTimeLeft(Math.max(0, cancelWindow - timeDiff));
            setModifyTimeLeft(Math.max(0, modifyWindow - timeDiff));
        }

        updateTimers(); // Initial call
        const interval = setInterval(updateTimers, 1000);

        return () => clearInterval(interval);
    }, [order.createdAt, status]);

    const handleCancelOrder = async (orderId: string | undefined) => {
        if (!orderId) return;
        if (!confirm("Are you sure you want to cancel this order?")) return;

        setIsCancelling(true);
        try {
            const res = await fetch(`/api/user/order/${orderId}/cancel`, { method: "POST" })
            if (res.ok) {
                setStatus("canceled")
                alert("Order canceled successfully");
            } else {
                const data = await res.json()
                alert(data.message || "Failed to cancel order");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setIsCancelling(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className='bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden'>
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 px-5 py-4 bg-linear-to-r from-green-50 to-white'>
                <div>
                    <h3 className='text-lg font-semibold text-gray-800'>order <span className='text-green-700 font-bold'>#{((order as any).id || order?._id)?.toString()?.slice(-6)}</span></h3>
                    <p className='text-xs text-gray-500 mt-1'>{new Date(order.createdAt!).toLocaleString()}</p>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                    {status !== "delivered" && <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${order.isPaid
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-red-100 text-red-700 border-red-300"
                        }`}
                    >
                        {order.isPaid ? "Paid" : "Unpaid"}
                    </span>}

                    <span className={`px-3 py-1 text-xs font-semibold border rounded-full ${getStatusColor(
                        status
                    )}`}
                    >
                        {status}
                    </span>

                </div>
            </div>

            {status != "delivered" && <div className='p-5 space-y-4'>
                {order.paymentMethod == "cod" ? <div className='flex items-center gap-2 text-gray-700 text-sm'>
                    <Truck size={16} className='text-green-600' />
                    Cash On Delivery
                </div> : <div className='flex items-center gap-2 text-gray-700 text-sm'>

                    <CreditCard size={16} className='text-green-600' />
                    Online Payment
                </div>}
                {order.assignedDeliveryBoy && <><div className='mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between'>
                    <div className='flex items-center gap-3 text-sm text-gray-700'>
                        <UserCheck className="text-blue-600" size={18} />
                        <div className='font-semibold text-gray-800'>
                            <p className=''>Assigned to : <span>{order.assignedDeliveryBoy.name}</span></p>
                            <p className='text-xs text-gray-600'>📞 +91 {order.assignedDeliveryBoy.mobile}</p>
                        </div>
                    </div>

                    <a href={`tel:${order.assignedDeliveryBoy.mobile}`} className='bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition'>Call</a>
                </div>
                    <button className='w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-green-700 transition' onClick={() => router.push(`/user/track-order/${order.id || order._id}`)}><Truck size={18} /> Track Your Order</button>
                </>
                }




                <div className='flex items-center gap-2 text-gray-700 text-sm'>
                    <MapPin size={16} className="text-green-600" />
                    <span className='truncate'>{order.addressFullAddress}</span>
                </div>

                {/* Cancel and Modify Action Windows */}
                {status == "pending" && (
                    <div className='bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between'>
                        <div className='text-xs text-gray-600'>
                            <p className='font-semibold text-gray-800 mb-1'>Order Actions</p>
                            {cancelTimeLeft > 0 || modifyTimeLeft > 0 ? (
                                <p>
                                    Cancel window: {cancelTimeLeft > 0 ? `${Math.floor(cancelTimeLeft / 60)}:${String(cancelTimeLeft % 60).padStart(2, '0')}` : 'Expired'} •
                                    Modify window: {modifyTimeLeft > 0 ? `${Math.floor(modifyTimeLeft / 60)}:${String(modifyTimeLeft % 60).padStart(2, '0')}` : 'Expired'}
                                </p>
                            ) : (
                                <p>Time windows for Cancellation and Modificaiton have expired.</p>
                            )}
                        </div>
                        <div className='flex gap-2 w-full sm:w-auto'>
                            <button
                                disabled={cancelTimeLeft === 0 || isCancelling}
                                onClick={() => handleCancelOrder(order.id || order._id)}
                                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition ${cancelTimeLeft > 0 && !isCancelling
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                            <button
                                disabled={modifyTimeLeft === 0}
                                onClick={() => router.push(`/user/checkout?addItemsTo=${order.id || order._id}`)}
                                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition ${modifyTimeLeft > 0
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Add More Items
                            </button>
                        </div>
                    </div>
                )}


                <div className='border-t border-gray-200 pt-3'>
                    <button
                        onClick={() => setExpanded(prev => !prev)}
                        className='w-full flex justify-between items-center text-sm font-medium text-gray-700 hover:text-green-700 transition'
                    >

                        <span className='flex items-center gap-2'>
                            <Package size={16} className="text-green-600" />
                            {expanded ? "Hide Order Items" : `view ${order.items.length} Items`}
                        </span>

                        {expanded ? <ChevronUp size={16} className="text-green-600" /> : <ChevronDown size={16} className="text-green-600" />}

                    </button>

                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: expanded ? "auto" : 0,
                            opacity: expanded ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className='mt-3 space-y-3'>
                            {order.items.map((item, index) => (
                                <div
                                    key={index}
                                    className='flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2 hover:bg-gray-100 transition'>
                                    <div className='flex items-center gap-3'>
                                        <Image src={item.image} alt={item.name} width={48} height={48} className=" rounded-lg object-cover border border-gray-200" />
                                        <div>
                                            <p className='text-sm font-medium text-gray-800'>{item.name}</p>
                                            <p className='text-xs text-gray-500'>{item.quantity} x {item.unit}</p>
                                        </div>
                                    </div>
                                    <p className='text-sm font-semibold text-gray-800'>₹{Number(item.price) * item.quantity}</p>

                                </div>
                            ))}
                        </div>

                    </motion.div>

                </div>

                <div className='border-t pt-3 flex justify-between items-center text-sm font-semibold text-gray-800'>
                    <div className='flex items-center gap-2 text-gray-700 text-sm'>
                        <Truck size={16} className="text-green-600" />
                        <span>Delivery: <span className='text-green-700 font-semibold'>{status}</span></span>
                    </div>
                    <div>
                        Total: <span className='text-green-700 font-bold'>₹{order.totalAmount}</span>
                    </div>
                </div>

            </div>}


        </motion.div>
    )
}

export default UserOrderCard
