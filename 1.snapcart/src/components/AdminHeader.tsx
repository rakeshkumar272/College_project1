'use client';
import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, Package, Truck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'next-auth/react';
import axios from 'axios';
import { getSocket } from '@/lib/socket';
import Link from 'next/link';

export default function AdminHeader({ setMobileSidebarOpen }: { setMobileSidebarOpen: (val: boolean) => void }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [counts, setCounts] = useState({ pendingOrdersCount: 0, pendingDeliveriesCount: 0 });

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await axios.get("/api/admin/notifications");
                setCounts(res.data);
            } catch (err) {
                console.error("Error fetching notifications", err);
            }
        };
        fetchCounts();

        const socket = getSocket();

        const handleNewOrder = () => {
            setCounts(prev => ({ ...prev, pendingOrdersCount: prev.pendingOrdersCount + 1 }));
        };
        const handleOrderAssigned = () => {
            fetchCounts();
        };

        if (socket) {
            socket.on("new-order", handleNewOrder);
            socket.on("order-assigned", handleOrderAssigned);
        }

        return () => {
            if (socket) {
                socket.off("new-order", handleNewOrder);
                socket.off("order-assigned", handleOrderAssigned);
            }
        };
    }, []);

    const totalNotifications = counts.pendingOrdersCount + counts.pendingDeliveriesCount;

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 z-30 relative">
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile Sidebar Toggle */}
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-gray-50"
                >
                    <Menu size={20} />
                </button>

                {/* Search Bar */}
                <div className="hidden sm:flex items-center max-w-md w-full bg-gray-50 rounded-full px-4 py-2 border border-transparent focus-within:bg-white focus-within:border-green-300 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search orders, customers..."
                        className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder:text-gray-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-6">
                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
                        className="relative p-2 text-gray-500 hover:text-green-600 transition-colors focus:outline-none"
                    >
                        <Bell size={20} />
                        {totalNotifications > 0 && (
                            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                                {totalNotifications > 9 ? '9+' : totalNotifications}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {notificationsOpen && (
                            <div
                                key="notif-overlay"
                                className="fixed inset-0 z-40"
                                onClick={() => setNotificationsOpen(false)}
                            />
                        )}
                        {notificationsOpen && (
                            <motion.div
                                key="notif-panel"
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden"
                            >
                                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">{totalNotifications} new</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {totalNotifications === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-500 flex flex-col items-center">
                                            <AlertCircle size={32} className="text-gray-300 mb-2" />
                                            <p className="text-sm">No new notifications</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {counts.pendingOrdersCount > 0 && (
                                                <Link href="/admin/orders" onClick={() => setNotificationsOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                                    <div className="mt-0.5 p-2 rounded-full bg-blue-50 text-blue-600">
                                                        <Package size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">New Orders Pending</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">You have {counts.pendingOrdersCount} order(s) waiting to be processed.</p>
                                                    </div>
                                                </Link>
                                            )}
                                            {counts.pendingDeliveriesCount > 0 && (
                                                <Link href="/admin/deliveries" onClick={() => setNotificationsOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                                    <div className="mt-0.5 p-2 rounded-full bg-orange-50 text-orange-600">
                                                        <Truck size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">Pending Deliveries</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{counts.pendingDeliveriesCount} assignment(s) are broadcasted but not accepted.</p>
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {totalNotifications > 0 && (
                                    <div className="px-4 py-2 border-t border-gray-50 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => { setCounts({ pendingOrdersCount: 0, pendingDeliveriesCount: 0 }); setNotificationsOpen(false); }}>
                                        <span className="text-xs font-medium text-green-700">Dismiss all</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
                        className="flex items-center gap-2 focus:outline-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200">
                            A
                        </div>
                    </button>

                    <AnimatePresence>
                        {profileOpen && (
                            <div
                                key="prof-overlay"
                                className="fixed inset-0 z-40"
                                onClick={() => setProfileOpen(false)}
                            />
                        )}
                        {profileOpen && (
                            <motion.div
                                key="prof-panel"
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
                            >
                                <div className="px-4 py-2 border-b border-gray-50">
                                    <p className="text-sm font-medium text-gray-800">Admin User</p>
                                    <p className="text-xs text-gray-500 truncate">admin@speedymart.com</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
