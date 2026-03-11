'use client';
import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setIsDesktopExpanded(false);
            } else {
                setIsDesktopExpanded(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden w-full">
            <AdminSidebar
                isDesktopExpanded={isDesktopExpanded}
                setIsDesktopExpanded={setIsDesktopExpanded}
                isMobileExpanded={isMobileExpanded}
                setIsMobileExpanded={setIsMobileExpanded}
                isMobile={isMobile}
            />
            <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
                <AdminHeader setMobileSidebarOpen={setIsMobileExpanded} />
                <main className="flex-1 overflow-y-auto w-full p-4 lg:p-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
