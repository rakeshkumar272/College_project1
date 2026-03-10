import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import React from 'react';
import AdminShell from '@/components/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Protect admin routes
    if (!session || session?.user?.role !== "admin") {
        redirect("/");
    }

    return (
        <AdminShell>
            {children}
        </AdminShell>
    );
}
