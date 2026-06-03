'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Loader, Package, Pencil, Search, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
const categories = [
    "Fruits & Vegetables",
    "Dairy & Eggs",
    "Rice, Atta & Grains",
    "Snacks & Biscuits",
    "Spices & Masalas",
    "Beverages & Drinks",
    "Personal Care",
    "Household Essentials",
    "Instant & Packaged Food",
    "Baby & Pet Care"
]
const units = [
    "kg", "g", "liter", "ml", "piece", "pack"
]
function ViewGrocery() {
    const router = useRouter()
    const [groceries, setGroceries] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [editing, setEditing] = useState<any | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [backendImage, setBackendImage] = useState<Blob | null>(null)
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [fillterd, setFilltered] = useState<any[]>([])
    const getGroceries = async () => {
        try {
            const result = await axios.get("/api/admin/get-groceries")
            if (Array.isArray(result.data)) {
                setGroceries(result.data)
                setFilltered(result.data)
            } else {
                console.error("API did not return an array", result.data)
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getGroceries()
    }, [])

    useEffect(() => {
        if (editing) {
            setImagePreview(editing.image)
        }
    }, [editing])


    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setBackendImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleEdit = async () => {
        setLoading(true)
        if (!editing) return
        try {
            const productId = editing.id || editing._id;
            const formData = new FormData()
            formData.append("name", editing?.name)
            formData.append("category", editing.category)
            formData.append("price", editing.price)
            formData.append("unit", editing.unit)
            if (backendImage) {
                formData.append("image", backendImage)
            }
            if (editing.variants) {
                formData.append("variants", JSON.stringify(editing.variants));
            }
            const result = await axios.put(`/api/admin/products/${productId}`, formData)
            
            // Optimistic update
            if (groceries) {
                const updated = groceries.map(g => (g.id === productId || g._id === productId) ? { ...g, ...editing } : g);
                setGroceries(updated);
                setFilltered(updated);
            }
            
            getGroceries()
            setImagePreview(null)
            setBackendImage(null)
            setEditing(null)
            setLoading(false)
            alert("Product updated successfully!")
        } catch (error) {
            console.log(error)
            alert("Failed to update product.")
            setLoading(false)
        }
    }
    const handleDelete = async () => {
        if (!editing) return
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        setDeleteLoading(true)
        try {
            const productId = editing.id || editing._id;
            const result = await axios.delete(`/api/admin/products/${productId}`)
            
            // Immediate UI local clear
            if (groceries) {
                const filtered = groceries.filter(g => g.id !== productId && g._id !== productId);
                setGroceries(filtered);
                setFilltered(filtered);
            }

            getGroceries()
            setImagePreview(null)
            setBackendImage(null)
            setEditing(null)
            setDeleteLoading(false)
            alert("Product deleted successfully!")
        } catch (error) {
            console.log(error)
            alert("Failed to delete product.")
            setDeleteLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const q = search.toLowerCase()

        setFilltered(
            groceries?.filter(
                (g) => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)


            )
        )

    }
    return (
        <div className="w-full">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-center sm:text-left"
            >
                <h1 className='text-2xl font-bold text-gray-800 flex items-center justify-center gap-2'><Package size={28} className='text-green-600' />Manage Groceries</h1>
            </motion.div>

            <motion.form initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSearch}
                className="flex items-center bg-white border border-gray-200 rounded-full px-5 py-3 shadow-sm mb-10 hover:shadow-lg transition-all max-w-lg mx-auto w-full">
                <Search className="text-gray-500 w-5 h-5 mr-2" />
                <input type="text" className='w-full outline-none text-gray-700 placeholder-gray-400' placeholder='Search by name or category...' value={search} onChange={(e) => setSearch(e.target.value)} />
            </motion.form>
            <div className='space-y-4'>
                {fillterd?.map((g, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 transition-all"
                    >
                        <div className='relative w-full sm:w-44 aspect-square rounded-xl overflow-hidden border border-gray-200'>
                            <Image
                                src={g.image || "/images/fallback.png"}
                                alt={g.name}
                                fill
                                unoptimized={true}
                                className='object-cover hover:scale-110 transition-transform duration-500'
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if(target.src !== "/images/fallback.png") {
                                        target.src = "/images/fallback.png";
                                        target.srcset = "";
                                    }
                                }}
                            />
                        </div>

                        <div className='flex-1 flex flex-col justify-between w-full'>
                            <div>
                                <h3 className='font-semibold text-gray-800 text-lg truncate'>{g.name}</h3>
                                <p className='text-gray-500 text-sm capitalize'>{g.category}</p>
                            </div>

                            <div className='mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                                <p className='text-green-700 font-bold text-lg'>
                                    ₹{g.price}/ <span className='text-gray-500 text-sm font-medium ml-1'>{g.unit}</span>
                                </p>
                                <button className='bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-all' onClick={() => setEditing(g)}>
                                    <Pencil size={15} /> Edit
                                </button>
                            </div>
                        </div>

                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {editing && (
                    <motion.div
                        key="edit-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm px-4"
                    >

                        <motion.div
                            key="edit-modal-panel"
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 relative"
                        >
                            <div className='flex justify-between items-center mb-4'>
                                <h2 className='text-2xl font-bold text-green-700'>Edit Grocery</h2>
                                <button className='text-gray-600 hover:text-red-600' onClick={() => { setEditing(null); setImagePreview(null); setBackendImage(null); }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className='relative aspect-square w-full rounded-lg overflow-hidden mb-4 border border-gray-200 group'>
                                {imagePreview && <Image
                                    src={imagePreview || "/images/fallback.png"}
                                    alt={editing.name}
                                    fill
                                    unoptimized={true}
                                    className='object-cover'
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if(target.src !== "/images/fallback.png") {
                                            target.src = "/images/fallback.png";
                                            target.srcset = "";
                                        }
                                    }}
                                />}
                                <label htmlFor='imageUpload' className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity'><Upload size={28} className='text-green-500' /></label>
                                <input type="file" accept='image/*' hidden id='imageUpload' onChange={handleImageUpload} />
                            </div>

                            <div className='space-y-4 max-h-[50vh] overflow-y-auto pr-2'>
                                <input
                                    type="text"
                                    placeholder='Enter Grocery Name'
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                    className='w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none' />

                                <select
                                    className='w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none bg-white'
                                    value={editing.category}
                                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                                >
                                    <option>Select Category</option>
                                    {categories.map((c, i) => (
                                        <option key={i} value={c}>{c}</option>
                                    ))}
                                </select>
                                
                                <div className='flex gap-2 w-full'>
                                    <input
                                        type="text"
                                        placeholder='Base Price'
                                        value={editing.price}
                                        onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                                        className='flex-1 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none' />
                                    <select
                                        className='flex-1 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none bg-white'
                                        value={editing.unit}
                                        onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                                    >
                                        <option>Select Unit</option>
                                        {units.map((u, i) => (
                                            <option key={i} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* VARIANTS RENDER */}
                                <div className='border-t pt-4 mt-2'>
                                    <div className='flex justify-between items-center mb-2'>
                                        <h3 className='font-bold text-gray-700 text-sm'>Product Variants</h3>
                                        <button 
                                            type="button" 
                                            onClick={() => setEditing({...editing, variants: [...(editing.variants || []), { weightInGrams: 0, price: 0, stock: 100 }]})}
                                            className='text-xs bg-gray-100 text-gray-700 font-semibold px-3 py-1 rounded-full hover:bg-gray-200'
                                        >
                                            + Add Variant
                                        </button>
                                    </div>
                                    
                                    <div className='space-y-3'>
                                        {editing.variants?.map((v: any, index: number) => (
                                            <div key={index} className='flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100'>
                                                <div className='flex gap-2 items-center'>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Weight (grams)" 
                                                        value={v.weightInGrams || ''} 
                                                        onChange={e => {
                                                            const newVar = [...editing.variants];
                                                            newVar[index].weightInGrams = Number(e.target.value);
                                                            setEditing({...editing, variants: newVar});
                                                        }}
                                                        className='w-1/2 text-xs border rounded p-2 outline-none focus:border-green-500'
                                                    />
                                                    <input 
                                                        type="number" 
                                                        placeholder="Price ₹" 
                                                        value={v.price} 
                                                        onChange={e => {
                                                            const newVar = [...editing.variants];
                                                            newVar[index].price = Number(e.target.value);
                                                            setEditing({...editing, variants: newVar});
                                                        }}
                                                        className='w-1/4 text-xs border rounded p-2 outline-none focus:border-green-500'
                                                    />
                                                    <button 
                                                        className='text-red-500 hover:bg-red-100 p-1.5 rounded-md ml-auto'
                                                        onClick={() => {
                                                            const newVar = editing.variants.filter((_: any, i: number) => i !== index);
                                                            setEditing({...editing, variants: newVar});
                                                        }}
                                                    >
                                                        <X size={14}/>
                                                    </button>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                    <label className='text-[10px] text-gray-500 font-bold uppercase'>Stock Quantity:</label>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Stock" 
                                                        value={v.stockQuantity || v.stock || 0} 
                                                        onChange={e => {
                                                            const newVar = [...editing.variants];
                                                            newVar[index].stockQuantity = Number(e.target.value);
                                                            // Keep stock for backward compatibility if needed during migration
                                                            newVar[index].stock = Number(e.target.value);
                                                            setEditing({...editing, variants: newVar});
                                                        }}
                                                        className='w-1/3 text-xs border rounded p-2 outline-none focus:border-green-500 bg-white'
                                                    />
                                                    {(v.stockQuantity || v.stock) <= 0 ? (
                                                        <span className='text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold'>OUT OF STOCK</span>
                                                    ) : (v.stockQuantity || v.stock) <= 5 ? (
                                                        <span className='text-[10px] bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-bold'>LOW STOCK</span>
                                                    ) : (
                                                        <span className='text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold'>IN STOCK</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(!editing.variants || editing.variants.length === 0) && (
                                            <p className='text-xs text-gray-400 italic text-center'>No variants added. Base price acts as primary item.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className='flex justify-end gap-3 mt-6'>
                                <button className="px-4 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2 hover:bg-green-700 transition-all"
                                    onClick={handleEdit}
                                    disabled={loading}
                                >
                                    {loading ? <Loader size={14} /> : "Edit Grocery"}
                                </button>
                                <button className="px-4 py-2 rounded-lg  bg-red-600 text-white flex items-center gap-2 hover:bg-red-700  transition"
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? <Loader size={14} /> : "Delete Grocery"}
                                </button>
                            </div>
                        </motion.div>


                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    )
}

export default ViewGrocery
