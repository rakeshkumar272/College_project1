'use client'
import { getSocket } from '@/lib/socket'
import { RootState } from '@/redux/store'
import axios from 'axios'

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false })
import DeliveryChat from './DeliveryChat'
import { div } from 'motion/react-client'
import { Loader, Bike, Power, Navigation, History, Headset, RefreshCw, Package, IndianRupee, Timer } from 'lucide-react'
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Link from 'next/link'

interface ILocation {
  latitude: number,
  longitude: number
}
function DeliveryBoyDashboard({ earning }: { earning: number }) {
  const { userData } = useSelector((state: RootState) => state.user)
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pendingAssignment, setPendingAssignment] = useState<any>(null)
  const [lastChecked, setLastChecked] = useState(5)
  const [ordersNearYou, setOrdersNearYou] = useState(2)
  const [otpError, setOtpError] = useState("")
  const [sendOtpLoading, setSendOtpLoading] = useState(false)
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false)
  const [otp, setOtp] = useState("")
  const [userLocation, setUserLocation] = useState<ILocation | null>(null)
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation | null>(null)
  useEffect(() => {
    // Identity is handled by GeoUpdater, but we can ensure it here too if needed
    const socket = getSocket()
    if (!userData?.id) return
    socket.emit("identity", userData.id)
  }, [userData?.id])

  useEffect((): any => {
    const socket = getSocket()

    socket.on("new-assignment", (deliveryAssignment) => {
      // Auto-assigned order arrived. Instantly fetch and display.
      fetchCurrentOrder()
    })
    return () => socket.off("new-assignment")
  }, [])

  useEffect(() => {
    // Dynamic ping timer for UI effect and actual DB poll
    if (!activeOrder && !pendingAssignment && isOnline) {
      
      const fetchNearby = async () => {
        try {
          const res = await axios.get('/api/delivery/nearby-orders')
          setOrdersNearYou(res.data.count || 0)
        } catch (error) {
          console.error("Error fetching nearby orders")
        }
      }

      fetchNearby() // Initial fetch

      const interval = setInterval(() => {
        setLastChecked(prev => prev >= 15 ? 2 : prev + 3)
      }, 3000)

      // Poll real queue every 12 seconds
      const dataInterval = setInterval(() => {
        fetchNearby()
      }, 12000)

      return () => {
        clearInterval(interval)
        clearInterval(dataInterval)
      }
    }
  }, [activeOrder, pendingAssignment, isOnline])
  const fetchCurrentOrder = async () => {
    try {
      const result = await axios.get("/api/delivery/current-order")
      if (result.data.active) {
        setActiveOrder(result.data.assignment)
        setUserLocation({
          latitude: result.data.assignment.order.addressLatitude,
          longitude: result.data.assignment.order.addressLongitude
        })
      }

    } catch (error) {
      console.log(error)
    }
  }


  useEffect((): any => {
    const socket = getSocket()
    
    // Initial location from browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setDeliveryBoyLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
      })
      
      const watchId = navigator.geolocation.watchPosition((pos) => {
        setDeliveryBoyLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
      })
      return () => navigator.geolocation.clearWatch(watchId)
    }

    socket.on("update-deliveryBoy-location", ({ userId, location }) => {
      // If we receive an update for ourself or another boy (though usually just ourself in this context)
      if (userId === userData?.id || userId === userData?._id) {
        setDeliveryBoyLocation({
          latitude: location.coordinates[1],
          longitude: location.coordinates[0]
        })
      }
    })
    return () => socket.off("update-deliveryBoy-location")
  }, [userData])

  const handlePickUp = async () => {
    if (!activeOrder) return
    try {
      await axios.post("/api/delivery/update-status", {
        orderId: activeOrder.order.id,
        status: "out of delivery"
      })
      await fetchCurrentOrder()
    } catch (error) {
      console.error("Error picking up order:", error)
      alert("Failed to pick up order")
    }
  }




  useEffect(() => {
    fetchCurrentOrder()
  }, [userData])


  const sendOtp = async () => {
    setSendOtpLoading(true)
    try {
      const result = await axios.post("/api/delivery/otp/send", { orderId: activeOrder.order.id || activeOrder.order._id })
      console.log(result.data)
      setShowOtpBox(true)
      setSendOtpLoading(false)
    } catch (error) {
      console.log(error)
      setSendOtpLoading(false)
    }
  }

  const verifyOtp = async () => {
    setVerifyOtpLoading(true)
    try {
      const result = await axios.post("/api/delivery/otp/verify", { orderId: activeOrder.order.id || activeOrder.order._id, otp })
      console.log(result.data)
      setActiveOrder(null)
      setVerifyOtpLoading(false)
      await fetchCurrentOrder()
      window.location.reload()
    } catch (error) {
      setOtpError("Otp Verification Error")
      setVerifyOtpLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchCurrentOrder()
    // artificial delay for smooth UX transition
    setTimeout(() => setIsRefreshing(false), 500)
  }

  if (!activeOrder) {
    const deliveriesDone = earning / 40 || 0;

    return (
      <div className='p-4 pt-[100px] pb-12 min-h-screen bg-gray-50 flex justify-center'>
        <div className='w-full max-w-[1100px] flex flex-col gap-6'>

          {/* Header & Status Toggle */}
          <div className='flex items-center justify-between bg-white p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100'>
            <div>
              <h2 className='text-xl font-bold text-gray-800'>Hi, {userData?.name?.split(' ')[0] || 'Partner'}!</h2>
              <div className='flex items-center gap-2 mt-1'>
                <span className='relative flex h-3 w-3'>
                  {isOnline && <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
                <span className={`text-sm font-semibold tracking-wide ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm ${isOnline
                ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                : 'bg-green-600 text-white border border-green-600 hover:bg-green-700 shadow-green-200'
                }`}
            >
              <Power size={18} />
              {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
            </button>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>

            {/* Left Column: Empty State & Performance */}
            <div className='lg:col-span-8 flex flex-col gap-6'>

              {/* Empty State with Map */}
              <div className='bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden relative min-h-[400px]'>
                <div className='absolute inset-0 z-0 grayscale-[50%] opacity-80'>
                  {deliveryBoyLocation && (
                    <LiveMap userLocation={{ latitude: 0, longitude: 0 }} deliveryBoyLocation={deliveryBoyLocation} height="100%" />
                  )}
                </div>

                <div className='absolute inset-0 z-10 bg-linear-to-t from-white/90 via-white/40 to-transparent pointer-events-none'></div>

                <div className='relative z-20 h-full flex flex-col items-center justify-center p-6 mt-16'>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg relative ${isOnline ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isOnline && <span className='absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-50'></span>}
                    <Bike size={36} className={isOnline ? 'animate-bounce' : ''} />
                  </div>
                  
                  <div className='bg-white/95 backdrop-blur-md px-8 py-5 rounded-2xl shadow-lg border border-white max-w-sm text-center'>
                    <h3 className='text-xl font-bold text-gray-800 mb-1'>
                      {isOnline ? 'Searching for orders...' : 'You are Offline'}
                    </h3>
                    <p className='text-gray-500 text-sm font-medium'>
                      {isOnline
                        ? `Last checked: ${lastChecked}s ago`
                        : 'Go online to start receiving delivery requests.'}
                    </p>
                    
                    {isOnline && ordersNearYou > 0 && (
                      <div className='mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2'>
                        <span className='w-2 h-2 rounded-full bg-green-500 animate-ping'></span>
                        <p className='text-sm text-gray-600 font-semibold'>Orders near you: <span className='text-green-700 font-bold'>{ordersNearYou}</span></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Stats Grid */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'>
                  <div className='w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3'><Package size={20} /></div>
                  <p className='text-xs text-gray-500 font-medium uppercase tracking-wider mb-1'>Deliveries</p>
                  <p className='text-2xl font-bold text-gray-800'>{deliveriesDone}</p>
                </div>
                <div className='bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'>
                  <div className='w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3'><IndianRupee size={20} /></div>
                  <p className='text-xs text-gray-500 font-medium uppercase tracking-wider mb-1'>Earnings</p>
                  <p className='text-2xl font-bold text-gray-800'>₹{earning || 0}</p>
                </div>
                <div className='bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'>
                  <div className='w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-3'><Navigation size={20} /></div>
                  <p className='text-xs text-gray-500 font-medium uppercase tracking-wider mb-1'>Distance</p>
                  <p className='text-2xl font-bold text-gray-800'>{(deliveriesDone * 4.2).toFixed(1)} <span className='text-sm text-gray-500 font-medium lowercase'>km</span></p>
                </div>
                <div className='bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'>
                  <div className='w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3'><Timer size={20} /></div>
                  <p className='text-xs text-gray-500 font-medium uppercase tracking-wider mb-1'>Online Time</p>
                  <p className='text-2xl font-bold text-gray-800'>4<span className='text-sm text-gray-500 font-medium lowercase'>h</span> 12<span className='text-sm text-gray-500 font-medium lowercase'>m</span></p>
                </div>
              </div>

            </div>

            {/* Right Column: Earnings Highlight & Quick Actions */}
            <div className='lg:col-span-4 flex flex-col gap-6 relative'>

              {/* Earnings Highlight */}
              <div className='bg-gray-900 rounded-3xl p-6 shadow-xl relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full blur-[80px] opacity-20'></div>
                <div className='relative z-10'>
                  <p className='text-gray-400 text-sm font-medium mb-1'>Today's Earnings</p>
                  <h3 className='text-4xl font-bold text-white mb-4'>₹{earning || 0}</h3>
                  <div className='bg-gray-800 rounded-xl p-4 flex items-center justify-between border border-gray-700'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center'>
                        <Package size={20} />
                      </div>
                      <div>
                        <p className='text-white font-medium text-sm'>{deliveriesDone} completed</p>
                        <p className='text-gray-400 text-xs'>Deliveries today</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className='bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6'>
                <h3 className='font-bold text-gray-800 mb-4'>Quick Actions</h3>
                <div className='grid grid-cols-2 gap-3'>
                  <Link href="/delivery/history" className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100'>
                    <History size={24} className='text-gray-700' />
                    <span className='text-xs font-semibold text-gray-700'>History</span>
                  </Link>
                  <Link href="/delivery/payouts" className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 text-center'>
                    <IndianRupee size={24} className='text-gray-700' />
                    <span className='text-xs font-semibold text-gray-700'>Payouts</span>
                  </Link>
                  <Link href="/delivery/support" className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100'>
                    <Headset size={24} className='text-gray-700' />
                    <span className='text-xs font-semibold text-gray-700'>Support</span>
                  </Link>
                  <button onClick={handleRefresh} disabled={isRefreshing} className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-green-50 hover:border-green-100 transition-colors border border-gray-100 group disabled:opacity-50'>
                    <RefreshCw size={24} className={`text-gray-700 group-hover:text-green-600 ${isRefreshing ? 'animate-spin text-green-600' : 'group-hover:animate-spin'}`} />
                    <span className='text-xs font-semibold text-gray-700 group-hover:text-green-700'>Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    )
  }

  if (activeOrder && userLocation) {
    const orderIdShort = activeOrder.order.orderNumber || (activeOrder.order.id || activeOrder.order._id).toString().slice(-6);

    return (
      <div className='p-4 pt-[100px] pb-12 min-h-screen bg-gray-50 flex justify-center'>
        <div className='w-full max-w-[1100px]'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold text-gray-900'>Active Delivery</h1>
            <p className='text-gray-500 font-medium mt-1'>Order <span className='text-green-700'>#{orderIdShort}</span></p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>

            {/* Left Column: Tracking & Status */}
            <div className='lg:col-span-7 flex flex-col gap-6'>

              {/* Map Card */}
              <div className='rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative z-0'>
                <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} height="320px" />
              </div>

              {/* Delivery Status Card */}
              <div className='bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6'>
                <div className='flex justify-between items-start mb-8'>
                  <div>
                    <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1'>Delivery Partner</p>
                    <p className='text-lg font-bold text-gray-800'>{userData?.name || "Partner"}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1'>Est. Arrival</p>
                    <p className='text-lg font-bold text-green-600'>~10 mins</p>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className='relative pt-4 pb-2'>
                  <div className='flex justify-between text-xs font-medium text-gray-400 relative z-10'>
                    <span className='text-green-600 font-bold'>Placed</span>
                    <span className='text-green-600 font-bold'>Prepared</span>
                    <span className='text-green-600 font-bold text-center translate-x-3'>On the way</span>
                    <span className={activeOrder.order.deliveryOtpVerification ? 'text-green-600 font-bold' : 'text-gray-400 font-bold'}>Delivered</span>
                  </div>
                  {/* The line */}
                  <div className='absolute top-[28px] left-[5%] right-[5%] h-1 bg-gray-100 -z-0 rounded-full mt-2 translate-y-[-50%]'>
                    <div className={`h-1 bg-green-500 rounded-full transition-all duration-500 ease-in-out ${activeOrder.order.deliveryOtpVerification ? 'w-full' : 'w-[66%]'}`}></div>
                  </div>
                  {/* Dots */}
                  <div className='flex justify-between absolute left-0 right-0 top-[28px] mt-2 translate-y-[-50%] z-10 px-1'>
                    <div className='h-3.5 w-3.5 rounded-full bg-green-600 border-2 border-white'></div>
                    <div className='h-3.5 w-3.5 rounded-full bg-green-600 border-2 border-white'></div>
                    <div className={`h-3.5 w-3.5 rounded-full border-2 border-white ${activeOrder.order.deliveryOtpVerification ? 'bg-green-600' : 'bg-green-600 shadow-[0_0_0_4px_#dcfce7]'}`}></div>
                    <div className={`h-3.5 w-3.5 rounded-full border-2 border-white ${activeOrder.order.deliveryOtpVerification ? 'bg-green-600 shadow-[0_0_0_4px_#dcfce7]' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Chat & OTP */}
            <div className='lg:col-span-5 flex flex-col gap-6 relative z-10'>

              {/* Delivery Chat Component */}
              <div className='bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden'>
                <DeliveryChat orderId={activeOrder.order.id || activeOrder.order._id} deliveryBoyId={(userData?.id || userData?._id)?.toString()!} />
              </div>

              {/* OTP Verification Card */}
              <div className='bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6'>
                <h3 className='text-lg font-bold text-gray-800 mb-2'>Delivery Verification</h3>
                <p className='text-sm text-gray-500 mb-6 leading-relaxed'>Ask the customer for the 4-digit security PIN to mark this order as safely delivered.</p>

                {activeOrder.order.status === "assigned" && (
                  <button
                    onClick={handlePickUp}
                    className='w-full py-4 bg-orange-500 hover:bg-orange-600 transition-colors font-semibold text-center text-white rounded-xl shadow-md shadow-orange-100/50 mb-4'
                  >
                    I have picked up the order
                  </button>
                )}

                {activeOrder.order.status === "out of delivery" && !showOtpBox && (
                  <button
                    onClick={sendOtp}
                    className='w-full py-4 bg-green-600 hover:bg-green-700 transition-colors font-semibold text-center text-white rounded-xl shadow-md shadow-green-100/50'
                  >{sendOtpLoading ? <Loader size={18} className='animate-spin mx-auto' /> : "I'm at the location"}</button>
                )}

                {showOtpBox && !activeOrder.order.deliveryOtpVerification && (
                  <div className='space-y-4 animate-in fade-in zoom-in duration-300'>
                    <input
                      type="text"
                      className='w-full py-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-green-500 outline-none transition-all'
                      placeholder='----'
                      maxLength={4}
                      onChange={(e) => setOtp(e.target.value)}
                      value={otp}
                    />
                    <button
                      className='w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 text-center rounded-xl transition-colors shadow-md shadow-gray-200'
                      onClick={verifyOtp}
                    >
                      {verifyOtpLoading ? <Loader size={18} className='animate-spin mx-auto' /> : "Verify PIN & Complete"}
                    </button>
                    {otpError && <div className='text-red-500 bg-red-50 p-3 rounded-lg text-sm text-center font-medium'>{otpError}</div>}

                    <div className='text-center pt-2'>
                      <button onClick={sendOtp} className='text-green-600 hover:text-green-700 text-sm font-semibold transition-colors'>Resend PIN</button>
                    </div>
                  </div>
                )}

                {activeOrder.order.deliveryOtpVerification && (
                  <div className='bg-green-50 p-4 rounded-xl text-center border border-green-100 overflow-hidden relative'>
                    <span className='text-green-700 font-bold flex items-center justify-center gap-2 relative z-10'>
                      🎉 Delivery completed!
                    </span>
                    <div className='absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]'></div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }

}

export default DeliveryBoyDashboard
