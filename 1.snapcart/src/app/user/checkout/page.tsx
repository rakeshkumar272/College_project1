'use client'
import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { ArrowLeft, Building, CreditCard, CreditCardIcon, Home, Loader2, LocateFixed, MapPin, Navigation, Phone, Search, Truck, User } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/redux/store'


import axios from 'axios'

import dynamic from 'next/dynamic'

const CheckOutMap = dynamic(() => import("@/components/CheckoutMap"), { ssr: false })



function Checkout() {
    const router = useRouter()
    const { userData } = useSelector((state: RootState) => state.user)
    const { subTotal, deliveryFee, finalTotal, cartData, addItemsTo } = useSelector((state: RootState) => state.cart)
    const dispatch = useDispatch()
    const [address, setAddress] = useState({
        fullName: "",
        mobile: "",
        city: "",
        state: "",
        pincode: "",
        fullAddress: ""
    })
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [position, setPosition] = useState<[number, number] | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online" | "upi">("cod")
    const [upiId, setUpiId] = useState("")
    const [isLocating, setIsLocating] = useState(false)
    const [permissionDenied, setPermissionDenied] = useState(false)
    
    useEffect(() => {
        if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords
                    setPosition([latitude, longitude])
                    setIsLocating(false);
                    setPermissionDenied(false);
                }, 
                (err) => { 
                    console.log('location error', err)
                    setIsLocating(false);
                    setPermissionDenied(true);
                }, 
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            )
        }
    }, [])
    useEffect(() => {
        if (userData) {
            setAddress((prev) => ({ ...prev, fullName: userData?.name || "" }))
            setAddress((prev) => ({ ...prev, mobile: userData?.mobile || "" }))
        }
    }, [userData])

    // Validate cart items against active database
    useEffect(() => {
        if (cartData && cartData.length > 0) {
            fetch("/api/admin/get-groceries")
              .then(res => res.json())
              .then(data => {
                if (Array.isArray(data)) {
                  const activeProductIds = new Set();
                  const activeVariantIds = new Set();
                  data.forEach((g: any) => {
                    activeProductIds.add(g.id || g._id);
                    if (g.variants) {
                      g.variants.forEach((v: any) => activeVariantIds.add(v.id || v._id));
                    }
                  });

                  let hasRemovedItems = false;
                  cartData.forEach((cartItem: any) => {
                    const baseId = cartItem.productId || cartItem._id?.split('_')[0] || cartItem.id?.split('_')[0];
                    const hasVariant = !!cartItem.variant;
                    
                    let isValid = false;
                    if (baseId && activeProductIds.has(baseId)) {
                        if (hasVariant) {
                            isValid = activeVariantIds.has(cartItem.variant);
                        } else {
                            isValid = true;
                        }
                    }

                    if (!isValid) {
                      console.warn(`Removing deleted product from cart: ${cartItem.name}`);
                      dispatch({ type: "cart/removeFromCart", payload: cartItem._id || cartItem.id });
                      hasRemovedItems = true;
                    }
                  });
                  if (hasRemovedItems) {
                      alert("Some items in your cart were removed because they are no longer available.");
                      router.push("/user/cart"); // Redirect back to cart to review changes
                  }
                }
              })
              .catch(err => console.error("Error syncing cart:", err));
        }
    }, [cartData, dispatch, router]);





    const handleSearchQuery = async () => {
        setSearchLoading(true)
        try {
            const { OpenStreetMapProvider } = await import("leaflet-geosearch")
            const provider = new OpenStreetMapProvider()
            const results = await provider.search({ query: searchQuery });
            if (results && results.length > 0) {
                setPosition([results[0].y, results[0].x])
            } else {
                alert("Location not found. Please try a different location.")
            }
        } catch (error) {
            console.error(error)
            alert("Error searching for location.")
        } finally {
            setSearchLoading(false)
        }
    }

    useEffect(() => {
        const fetchAddress = async () => {
            if (!position) return
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
                console.log(result.data)
                setAddress(prev => ({
                    ...prev,
                    city: result.data.address.city || result.data.address.town || result.data.address.village || result.data.address.county || result.data.address.state_district || "",
                    state: result.data.address.state || "",
                    pincode: result.data.address.postcode || "",
                    fullAddress: result.data.display_name
                }))
            } catch (error) {
                console.log(error)
            }
        }
        fetchAddress()
    }, [position])

    const addItemsToOrderId = addItemsTo;

    const handleCod = async () => {
        if (!position) {
            return null
        }
        try {
            const payload = {
                userId: userData?.id || userData?._id,
                items: cartData.map(item => (
                    {
                        grocery: item.productId || item._id.split('_')[0],
                        variant: item.variant,
                        name: item.name,
                        price: item.price,
                        unit: item.unit,
                        quantity: item.quantity,
                        image: item.image
                    }
                )),
                totalAmount: finalTotal,
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latitude: position[0],
                    longitude: position[1]
                },
                paymentMethod
            };

            if (addItemsToOrderId) {
                // Modifying an existing order
                await axios.post(`/api/user/order/${addItemsToOrderId}/add-items`, payload);
                alert("Items successfully added to your existing order!");
            } else {
                // Normal checkout
                await axios.post("/api/user/order", payload);
            }
            
            dispatch({ type: "cart/clearCart" });
            router.push("/user/order-success")
        } catch (error: any) {
            console.log(error)
            const errorMessage = error.response?.data?.message || "Failed to process order. Check console for details.";
            alert(errorMessage);
        }
    }

    const handleOnlinePayment = async () => {
        if (!position) {
            return null
        }
        
        try {
            const payload = {
                userId: userData?.id || userData?._id,
                items: cartData.map(item => (
                    {
                        grocery: item.productId || item._id.split('_')[0],
                        variant: item.variant,
                        name: item.name,
                        price: item.price,
                        unit: item.unit,
                        quantity: item.quantity,
                        image: item.image
                    }
                )),
                totalAmount: finalTotal,
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latitude: position[0],
                    longitude: position[1]
                },
                paymentMethod
            };

            if (addItemsToOrderId) {
                // If appending, append directly and inform user of diff
                await axios.post(`/api/user/order/${addItemsToOrderId}/add-items`, payload);
                alert(`Items appended! You can pay the difference (₹${finalTotal}) to the delivery partner.`);
                dispatch({ type: "cart/clearCart" });
                router.push("/user/order-success");
                return;
            }

            const result = await axios.post("/api/user/payment", payload)
            window.location.href = result.data.url
        } catch (error: any) {
            console.log(error)
            const errorMessage = error.response?.data?.message || "Failed to process order. Check console for details.";
            alert(errorMessage);
        }
    }

    const handleUpi = async () => {
        if (!position) {
            alert("Please select a delivery address.");
            return null;
        }
        
        // Validate UPI ID format
        const upiRegex = /^[\w.-]+@[\w.-]+$/;
        if (!upiRegex.test(upiId)) {
            alert("Please enter a valid UPI ID (e.g. username@upi)");
            return;
        }

        try {
            const payload = {
                userId: userData?.id || userData?._id,
                items: cartData.map(item => (
                    {
                        grocery: item.productId || item._id.split('_')[0],
                        variant: item.variant,
                        name: item.name,
                        price: item.price,
                        unit: item.unit,
                        quantity: item.quantity,
                        image: item.image
                    }
                )),
                totalAmount: finalTotal,
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latitude: position[0],
                    longitude: position[1]
                },
                paymentMethod: "upi"
            };

            if (addItemsToOrderId) {
                await axios.post(`/api/user/order/${addItemsToOrderId}/add-items`, payload);
                alert("Items successfully added to your existing order! (UPI)");
            } else {
                await axios.post("/api/user/order", payload);
                alert("UPI Payment initiated and successful!");
            }
            
            dispatch({ type: "cart/clearCart" });
            router.push("/user/order-success")
        } catch (error: any) {
            console.log(error)
            const errorMessage = error.response?.data?.message || "Failed to process order. Check console for details.";
            alert(errorMessage);
        }
    }



    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords
                    setPosition([latitude, longitude])
                    setIsLocating(false);
                    setPermissionDenied(false);
                }, 
                (err) => { 
                    console.log('location error', err)
                    setIsLocating(false);
                    setPermissionDenied(true);
                }, 
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            )
        }
    }



    return (
        <div className='w-[92%] md:w-[80%] mx-auto py-10 relative'>
            <motion.button
                whileTap={{ scale: 0.97 }}
                className='absolute left-0 top-2 flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold'
                onClick={() => router.push("/user/cart")}
            >
                <ArrowLeft size={16} />
                <span>Back to cart</span>
            </motion.button>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='text-3xl md:text-4xl font-bold text-green-700 text-center mb-10'
            >Checkout</motion.h1>

            <div className='grid md:grid-cols-2 gap-8'>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                        <MapPin className='text-green-700' /> Delivery Address
                    </h2>
                    <div className='space-y-4'>
                        <div className='relative'>
                            <User className="absolute left-3 top-3 text-green-600" size={18} />
                            <input type="text" value={address.fullName || ""} onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                        </div>
                        <div className='relative'>
                            <Phone className="absolute left-3 top-3 text-green-600" size={18} />
                            <input type="text" value={address.mobile || ""} onChange={(e) => setAddress((prev) => ({ ...prev, mobile: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                        </div>
                        <div className='relative'>
                            <Home className="absolute left-3 top-3 text-green-600" size={18} />
                            <input type="text" value={address.fullAddress || ""} placeholder='Full Address' onChange={(e) => setAddress((prev) => ({ ...prev, fullAddress: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                        </div>
                        <div className='grid grid-cols-3 gap-3'>
                            <div className='relative'>
                                <Building className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" value={address.city || ""} placeholder='city' onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                            <div className='relative'>
                                <Navigation className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" value={address.state || ""} placeholder='state' onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                            <div className='relative'>
                                <Search className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" value={address.pincode || ""} placeholder='pincode' onChange={(e) => setAddress((prev) => ({ ...prev, pincode: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                        </div>
                        <div className='flex gap-2 mt-3'>
                            <input type="text" placeholder='search city or area...' className='flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <button className='bg-green-600 text-white px-5 rounded-lg hover:bg-green-700 transition-all font-medium' onClick={handleSearchQuery}>{searchLoading ? <Loader2 size={16} className='animate-spin' /> : "Search"}</button>
                        </div>
                        <div className='relative mt-6 h-[330px] rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gray-50'>
                            {position ? (
                                <CheckOutMap position={position} setPosition={setPosition} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                    {isLocating ? (
                                        <>
                                            <Loader2 size={48} className="animate-spin text-green-600 mb-3" />
                                            <span className="font-semibold text-gray-600">Detecting your location...</span>
                                            <span className="text-xs mt-1">Please allow location access in your browser.</span>
                                        </>
                                    ) : permissionDenied ? (
                                        <>
                                            <MapPin size={48} className="text-red-400 mb-3" />
                                            <span className="font-semibold text-gray-600">Location permission denied</span>
                                            <span className="text-xs mt-1 text-red-500">Please search your address manually or enable location access.</span>
                                        </>
                                    ) : (
                                        <>
                                            <MapPin size={48} className="opacity-50 mb-3" />
                                            <span className="font-semibold text-gray-600">Map is waiting for location</span>
                                            <span className="text-xs mt-1">Search an address or click the target icon below.</span>
                                        </>
                                    )}
                                </div>
                            )}
                            <motion.button
                                whileTap={{ scale: 0.93 }}
                                className='absolute bottom-4 right-4 bg-green-600 text-white shadow-lg rounded-full p-3 hover:bg-green-700 transition-all flex items-center justify-center z-999'
                                onClick={handleCurrentLocation}
                            >
                                <LocateFixed size={22} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 h-fit'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'><CreditCard className='text-green-600' /> Payment Method</h2>
                    <div className='space-y-4 mb-6'>
                        <button
                            onClick={() => setPaymentMethod("online")}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "online"
                                ? "border-green-600 bg-green-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}>
                            <CreditCardIcon className='text-green-600' /><span className='font-medium text-gray-700'>Pay Online (stripe)</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod("cod")}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "cod"
                                ? "border-green-600 bg-green-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}>
                            <Truck className='text-green-600' /><span className='font-medium text-gray-700'>Cash on Delivery</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod("upi")}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "upi"
                                ? "border-green-600 bg-green-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}>
                            <svg className='text-green-600 w-6 h-6' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 6h6v6"></path><path d="M20 6l-7 7"></path><path d="M10 20l-7-7 7-7"></path><path d="M3 13v7h7"></path></svg>
                            <span className='font-medium text-gray-700'>UPI Payment</span>
                        </button>
                        
                        {paymentMethod === "upi" && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                className='p-4 bg-gray-50 border rounded-lg border-green-200 overflow-hidden'
                            >
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>Enter UPI ID</label>
                                <input 
                                    type="text" 
                                    value={upiId} 
                                    onChange={(e) => setUpiId(e.target.value)} 
                                    placeholder="e.g. username@upi" 
                                    className='w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none' 
                                />
                                <div className='text-xs text-gray-500 mt-3 p-3 bg-white border border-gray-100 rounded-md flex items-center justify-center gap-2'>
                                   <span>📲</span> Or scan QR code using your UPI app after placing order.
                                </div>
                            </motion.div>
                        )}
                    </div>
                    <div className='border-t pt-4 text-gray-700 space-y-2 text-sm sm:text-base'>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Subtotal</span>
                            <span className='font-semibold text-green-600'>₹{subTotal}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Delivery Fee</span>
                            <span className='font-semibold text-green-600'>₹{deliveryFee}</span>
                        </div>
                        <div className='flex justify-between font-bold text-lg border-t pt-3'>
                            <span>Final Total</span>
                            <span className='font-semibold text-green-600'>₹{finalTotal}</span>
                        </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.93 }} className='w-full mt-6 bg-green-600 text-white py-3 rounded-full hover:bg-green-700 transition-all font-semibold'
                        onClick={() => {
                            if (paymentMethod === "cod") {
                                handleCod()
                            } else if (paymentMethod === "online") {
                                handleOnlinePayment()
                            } else if (paymentMethod === "upi") {
                                handleUpi()
                            }
                        }}
                    >
                        {paymentMethod === "cod" ? "Place Order" : paymentMethod === "upi" ? "Pay via UPI & Place Order" : "Pay & Place Order"}

                    </motion.button>
                </motion.div>
            </div>

        </div>
    )
}

export default function CheckoutPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-green-600" size={32} /></div>}>
            <Checkout />
        </React.Suspense>
    )
}
