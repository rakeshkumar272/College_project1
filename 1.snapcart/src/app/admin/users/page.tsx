'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { User, Trash2, Shield, Mail, Phone, Calendar, Loader, Search } from 'lucide-react'
import { motion } from 'motion/react'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/users')
            setUsers(res.data)
            setLoading(false)
        } catch (error) {
            console.error("Error fetching users", error)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action is irreversible.")) return
        try {
            await axios.delete('/api/admin/users', { data: { userId } })
            fetchUsers()
            alert("User deleted successfully")
        } catch (error) {
            alert("Failed to delete user")
        }
    }

    const handleStatusChange = async (userId: string, status: string) => {
        try {
            await axios.put('/api/admin/users/status', { userId, status })
            fetchUsers()
        } catch (error) {
            alert("Failed to update user status")
        }
    }

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.mobile?.includes(search)
    )

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="animate-spin text-green-600" /></div>

    return (
        <div className='w-full'>
            <div className='mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage customers, delivery partners, and administrative staff.</p>
                </div>
                <div className='relative w-full md:w-64'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={18} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all text-sm'
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className='overflow-x-auto'>
                    <table className='w-full text-left border-collapse'>
                        <thead>
                            <tr className='bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100'>
                                <th className='px-6 py-4'>User</th>
                                <th className='px-6 py-4'>Contact</th>
                                <th className='px-6 py-4'>Role</th>
                                <th className='px-6 py-4'>Joined</th>
                                <th className='px-6 py-4 text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-50'>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className='hover:bg-gray-50/50 transition-colors'>
                                    <td className='px-6 py-4'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold border border-green-100'>
                                                {user.image ? <img src={user.image} className="w-full h-full rounded-full object-cover"/> : user.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className='text-sm font-bold text-gray-800'>{user.name}</p>
                                                <p className='text-[10px] text-gray-400 font-medium'>ID: {user.id.slice(-8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='space-y-1'>
                                            <p className='text-xs text-gray-600 flex items-center gap-1.5'><Mail size={12}/> {user.email}</p>
                                            <p className='text-xs text-gray-600 flex items-center gap-1.5'><Phone size={12}/> {user.mobile || 'No mobile'}</p>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                            user.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                            user.role === 'deliveryBoy' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            'bg-green-100 text-green-700 border-green-200'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <p className='text-xs text-gray-500 flex items-center gap-1.5'><Calendar size={12}/> {new Date(user.createdAt).toLocaleDateString()}</p>
                                    </td>
                                    <td className='px-6 py-4 text-right flex items-center justify-end gap-2'>
                                        <select 
                                            value={user.status || "ACTIVE"} 
                                            onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none ${
                                                user.status === 'BLOCKED' ? 'bg-red-50 text-red-600 border-red-200' :
                                                user.status === 'RESTRICTED' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                'bg-green-50 text-green-600 border-green-200'
                                            }`}
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="RESTRICTED">Restricted</option>
                                            <option value="BLOCKED">Blocked</option>
                                        </select>
                                        <button 
                                            onClick={() => handleDelete(user.id)}
                                            className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-2'
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className='p-12 text-center'>
                        <p className='text-gray-400 text-sm'>No users found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
