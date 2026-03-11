'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Users, Truck, BarChart3, Settings, X, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminSidebar({
    isDesktopExpanded,
    setIsDesktopExpanded,
    isMobileExpanded,
    setIsMobileExpanded,
    isMobile
}: {
    isDesktopExpanded: boolean,
    setIsDesktopExpanded: (val: boolean) => void,
    isMobileExpanded: boolean,
    setIsMobileExpanded: (val: boolean) => void,
    isMobile: boolean
}) {
    const pathname = usePathname();

    const links = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
        { name: 'Products', href: '/admin/products', icon: PackageSearch },
        { name: 'Customers', href: '/admin/customers', icon: Users },
        { name: 'Deliveries', href: '/admin/deliveries', icon: Truck },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    const SidebarContent = ({ isExpanded }: { isExpanded: boolean }) => (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-xs">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 relative">
                <div className={`flex items-center \${isExpanded ? 'justify-start' : 'justify-center'} w-full`}>
                    {isExpanded ? (
                        <Link href={"/admin"} className='text-green-700 font-extrabold text-2xl tracking-wide'>
                            SpeedyMart
                        </Link>
                    ) : (
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
                    )}
                </div>
                {!isMobile && (
                    <button
                        onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
                        className="absolute -right-3 top-5 bg-white border border-gray-200 rounded-full p-1 text-gray-500 hover:text-green-600 shadow-sm z-50"
                    >
                        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center \${isExpanded ? 'justify-start px-3' : 'justify-center'} py-3 rounded-lg transition-colors group relative
                \${isActive 
                  ? 'bg-green-50 text-green-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
                            title={!isExpanded ? link.name : undefined}
                        >
                            <link.icon className={`w-5 h-5 \${isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                            {isExpanded && <span className="ml-3">{link.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className={`p-4 border-t border-gray-100 flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold shrink-0">
                    A
                </div>
                {isExpanded && (
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
                        <p className="text-xs text-gray-500 truncate">admin@speedymart.com</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <motion.aside
                animate={{ width: isDesktopExpanded ? 240 : 80 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="hidden md:block h-full z-20 bg-white shrink-0 border-r border-gray-200"
            >
                <SidebarContent isExpanded={isDesktopExpanded} />
            </motion.aside>

            <AnimatePresence>
                {isMobile && isMobileExpanded && (
                    <motion.div
                        key="mobile-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileExpanded(false)}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />
                )}
                {isMobile && isMobileExpanded && (
                    <motion.aside
                        key="mobile-sidebar"
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className="fixed left-0 top-0 h-screen w-64 z-50 bg-white shadow-xl md:hidden"
                    >
                        <div className="absolute right-2 top-4">
                            <button onClick={() => setIsMobileExpanded(false)} className="p-2 text-gray-500 hover:text-gray-800">
                                <X size={20} />
                            </button>
                        </div>
                        <SidebarContent isExpanded={true} />
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
