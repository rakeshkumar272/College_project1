'use client'
import { getSocket } from '@/lib/socket'
import { RootState } from '@/redux/store'
import axios from 'axios'
import { resolveSoa } from 'dns'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false })
import DeliveryChat from './DeliveryChat'
import { div } from 'motion/react-client'
import { Loader, Bike, Power, Navigation, History, Headset, RefreshCw, Package, IndianRupee, Timer } from 'lucide-react'
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ILocation {
  latitude: number,
  longitude: number
}
function DeliveryBoyDashboard({ earning }: { earning: number }) {
  const [assignments, setAssignments] = useState<any[]>([])
  const { userData } = useSelector((state: RootState) => state.user)
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [otpError, setOtpError] = useState("")
  const [sendOtpLoading, setSendOtpLoading] = useState(false)
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false)
  const [otp, setOtp] = useState("")
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
  const fetchAssignments = async () => {
    try {
      const result = await axios.get("/api/delivery/get-assignments")
      setAssignments(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    // Identity is handled by GeoUpdater, but we can ensure it here too if needed
    const socket = getSocket()
    if (!userData?.id) return
    socket.emit("identity", userData.id)
  }, [userData?.id])

  useEffect((): any => {
    const socket = getSocket()

    socket.on("new-assignment", (deliveryAssignment) => {
      setAssignments((prev) => [...prev, deliveryAssignment])
    })
    return () => socket.off("new-assignment")
  }, [])

  const handleAccept = async (id: string) => {
    try {
      const result = await axios.get(`/api/delivery/assignment/${id}/accept-assignment`)
      setAssignments((prev) => prev.filter(a => (a.id || a._id) !== id))
      fetchCurrentOrder()
    } catch (error) {
      console.log(error)
      alert("Failed to accept assignment. It may have expired or been taken by someone else.");
    }
  }

  const handleReject = (id: string) => {
    // Just remove it locally from the assignments list
    setAssignments((prev) => prev.filter(a => (a.id || a._id) !== id))
  }


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
    socket.on("update-deliveryBoy-location", ({ userId, location }) => {
      setDeliveryBoyLocation({
        latitude: location.coordinates[1],
        longitude: location.coordinates[0]
      })
    })
    return () => socket.off("update-deliveryBoy-location")
  }, [])




  useEffect(() => {
    fetchCurrentOrder()
    fetchAssignments()
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

  if (!activeOrder && assignments.length === 0) {
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

              {/* Empty State Banner */}
              <div className='bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-12 flex flex-col items-center justify-center text-center min-h-[320px]'>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${isOnline ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                  <Bike size={48} className={isOnline ? 'animate-bounce' : ''} />
                </div>
                <h3 className='text-2xl font-bold text-gray-800 mb-2'>
                  {isOnline ? 'Looking for Orders...' : 'You are currently Offline'}
                </h3>
                <p className='text-gray-500 max-w-[280px]'>
                  {isOnline
                    ? 'Stay online and keep the app open to receive delivery requests near you.'
                    : 'Go online to start receiving delivery requests and earning money.'}
                </p>
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
                  <button className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100'>
                    <History size={24} className='text-gray-700' />
                    <span className='text-xs font-semibold text-gray-700'>History</span>
                  </button>
                  <button className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 text-center'>
                    <IndianRupee size={24} className='text-gray-700' />
                    <span className='text-xs font-semibold text-gray-700'>Payouts</span>
                  </button>
                  <button className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100'>
                    <Headset size={24} className='text-gray-700' />
                    <span className='text-xs font-semibold text-gray-700'>Support</span>
                  </button>
                  <button onClick={() => window.location.reload()} className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-green-50 hover:border-green-100 transition-colors border border-gray-100 group'>
                    <RefreshCw size={24} className='text-gray-700 group-hover:text-green-600 group-hover:animate-spin' />
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
    const orderIdShort = (activeOrder.order.id || activeOrder.order._id).toString().slice(-6);

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
                <DeliveryChat orderId={activeOrder.order.id || activeOrder.order._id} deliveryBoyId={userData?._id?.toString()!} />
              </div>

              {/* OTP Verification Card */}
              <div className='bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6'>
                <h3 className='text-lg font-bold text-gray-800 mb-2'>Delivery Verification</h3>
                <p className='text-sm text-gray-500 mb-6 leading-relaxed'>Ask the customer for the 4-digit security PIN to mark this order as safely delivered.</p>

                {!activeOrder.order.deliveryOtpVerification && !showOtpBox && (
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


  return (
    <div className='w-full min-h-screen bg-gray-50 p-4'>
      <div className="max-w-3xl mx-auto">
        <h2 className='text-2xl font-bold mt-[120px] mb-[30px]'>Delivery Assigments</h2>

        {assignments.map((a, index) => (
          <div key={index} className='p-5 bg-white rounded-xl shadow mb-4  border'>
            <p ><b>Order Id </b> #{(a?.order.id || a?.order._id)?.toString().slice(-6)}</p>
            <p className='text-gray-600'>{a.order.addressFullAddress}</p>

            <div className='flex gap-3 mt-4'>
              <button className='flex-1 bg-green-600 text-white py-2 rounded-lg'
                onClick={() => handleAccept(a.id || a._id)}
              >Accept</button>
              <button
                onClick={() => handleReject(a.id || a._id)}
                className='flex-1 bg-red-600 text-white py-2 rounded-lg'
              >Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DeliveryBoyDashboard
