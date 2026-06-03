'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ShieldAlert, CheckCircle, Plus } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    phone: string;
    status: string;
    createdAt: string;
}

export default function DeliveryAgents() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await axios.get('/api/admin/agents');
            setAgents(res.data.agents);
        } catch (error) {
            console.error("Error fetching agents", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation: Must be 10 digits starting with 6-9
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            setPhoneError("Enter a valid 10-digit number (e.g., starts with 6-9)");
            return;
        }

        // Validation: Block common/dummy sequences
        const isCommon = /^(\d)\1{9}$/.test(phone) || 
                         ['1234567890', '0987654321', '0123456789', '9876543210'].includes(phone);
        if (isCommon) {
            setPhoneError("This number is too common. Please enter a real number.");
            return;
        }

        setPhoneError('');
        setAdding(true);
        try {
            const res = await axios.post('/api/admin/agents', { name, phone });
            setAgents([res.data.agent, ...agents]);
            setName('');
            setPhone('');
        } catch (error) {
            console.error("Error adding agent", error);
            alert("Error adding agent");
        } finally {
            setAdding(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        try {
            await axios.patch(`/api/admin/agents/${id}`, { status: newStatus });
            setAgents(agents.map(a => a.id === id ? { ...a, status: newStatus } : a));
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Delivery Agents</h1>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-lg font-semibold mb-4">Add New Agent</h2>
                <form onSubmit={handleAddAgent} className="flex gap-4 items-start">
                    <input 
                        type="text" 
                        placeholder="Agent Name" 
                        required 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
                    />
                    <div className="flex-1 flex flex-col relative">
                        <input 
                            type="text" 
                            placeholder="Phone Number" 
                            required 
                            value={phone} 
                            onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                            className={`border ${phoneError ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 w-full`}
                        />
                        {phoneError && <span className="text-red-500 text-xs mt-1 absolute -bottom-5">{phoneError}</span>}
                    </div>
                    <button 
                        type="submit" 
                        disabled={adding}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                    >
                        {adding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />} Add Agent
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600">Name</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Phone</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Joined Date</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></td>
                            </tr>
                        ) : agents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No delivery agents found.</td>
                            </tr>
                        ) : (
                            agents.map(agent => (
                                <tr key={agent.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-800">{agent.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{agent.phone}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold \${agent.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {agent.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{new Date(agent.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => toggleStatus(agent.id, agent.status)}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ml-auto \${agent.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                        >
                                            {agent.status === 'ACTIVE' ? <><ShieldAlert size={16} /> Block</> : <><CheckCircle size={16} /> Unblock</>}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
