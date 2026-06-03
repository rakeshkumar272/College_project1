'use client'
import { ArrowLeft, Loader, Plus, PlusCircle, Trash2, Upload, Box } from 'lucide-react'
import Link from 'next/link'
import React, { ChangeEvent, FormEvent, useState } from 'react'
import { motion, AnimatePresence } from "motion/react"
import Image from 'next/image'
import axios from 'axios'

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

const units = ["kg", "g", "liter", "ml", "piece", "pack", "bunch", "dozen"]

interface IVariant {
    weightInGrams: number;
    price: string | number;
    stockQuantity: string | number;
}

function AddGrocery() {
    // Info
    const [name, setName] = useState("")
    const [category, setCategory] = useState("")
    const [description, setDescription] = useState("")

    // Old base pricing fields (Kept for compatibility with backend parsing if needed, but driven via the primary variant UI logically)
    const [unit, setUnit] = useState("")
    const [price, setPrice] = useState("") // Primary base price reference

    const [expiryDate, setExpiryDate] = useState("")
    const [sortOrder, setSortOrder] = useState(0)
    const [tags, setTags] = useState<string[]>([])

    const availableTags = ["PRICE_DROP", "BESTSELLER", "GOURMET", "IMPORTED"]
    
    const handleTagToggle = (tag: string) => {
        if (tags.includes(tag)) setTags(tags.filter(t => t !== tag))
        else setTags([...tags, tag])
    }
    
    // Variant Builder
    const [variants, setVariants] = useState<IVariant[]>([])
    const [vWeightInGrams, setVWeightInGrams] = useState("")
    const [vPrice, setVPrice] = useState("")
    const [vStock, setVStock] = useState("")

    // Inventory & Discount
    const [stockQuantity, setStockQuantity] = useState("")
    const [stockUnit, setStockUnit] = useState("")
    const [discountPercent, setDiscountPercent] = useState(0)

    // Media & State
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [backendImage, setBackendImage] = useState<File | null>(null)

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length == 0) return
        const file = files[0]
        setBackendImage(file)
        setPreview(URL.createObjectURL(file))
    }

    const addVariant = () => {
        if (!vWeightInGrams || !vPrice) return;
        setVariants([...variants, { 
            weightInGrams: Number(vWeightInGrams), 
            price: Number(vPrice), 
            stockQuantity: Number(vStock) || 0
        }])
        setVWeightInGrams("")
        setVPrice("")
        setVStock("")
    }

    const removeVariant = (index: number) => {
        const newV = [...variants]
        newV.splice(index, 1)
        setVariants(newV)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (variants.length === 0) {
            alert("Please add at least one pricing variant.")
            return;
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("category", category)
            formData.append("description", description)
            formData.append("unit", unit)
            formData.append("price", price)
            formData.append("stockQuantity", stockQuantity)
            if (stockUnit) formData.append("stockUnit", stockUnit)
            formData.append("discountPercent", discountPercent.toString())
            if (expiryDate) formData.append("expiryDate", expiryDate)
            formData.append("tags", JSON.stringify(tags))
            formData.append("sortOrder", sortOrder.toString())
            formData.append("variants", JSON.stringify(variants))

            if (backendImage) {
                formData.append("image", backendImage)
            }

            const result = await axios.post("/api/admin/add-grocery-api", formData)
            console.log(result.data)
            
            // Success Reset
            setName("")
            setCategory("")
            setDescription("")
            setUnit("")
            setPrice("")
            setStockQuantity("")
            setStockUnit("")
            setDiscountPercent(0)
            setExpiryDate("")
            setSortOrder(0)
            setTags([])
            setVariants([])
            setPreview(null)
            setBackendImage(null)
            
            alert("Grocery product added successfully!")
            setLoading(false)
        } catch (error) {
            console.log(error)
            alert("Error adding grocery.")
            setLoading(false)
        }
    }

    return (
        <div className='w-full max-w-5xl mx-auto'>
            <div className='flex items-center gap-4 mb-6'>
                <Link href="/admin/products" className='p-2 bg-white rounded-full hover:bg-gray-50 border border-gray-200 transition'>
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900'>Create Product</h1>
                    <p className='text-gray-500 text-sm mt-1'>Add a new grocery item to the catalog.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Left Column (Main Info) */}
                <div className='col-span-1 lg:col-span-2 space-y-6'>
                    
                    {/* Information Section */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className='bg-white shadow-sm rounded-2xl border border-gray-100 p-6'>
                        <h2 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'><Box size={20} className='text-green-600'/> Product Information</h2>
                        
                        <div className='space-y-4'>
                            <div>
                                <label className='block text-gray-700 font-medium mb-1.5 text-sm'>Grocery Name <span className='text-red-500'>*</span></label>
                                <input type="text" required placeholder='e.g., Farm Fresh Organic Eggs' 
                                    className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50'
                                    onChange={(e) => setName(e.target.value)} value={name} />
                            </div>
                            
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-gray-700 font-medium mb-1.5 text-sm'>Category <span className='text-red-500'>*</span></label>
                                    <select required className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50' 
                                        onChange={(e) => setCategory(e.target.value)} value={category}>
                                        <option value="">Select Category</option>
                                        {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-gray-700 font-medium mb-1.5 text-sm'>Base Unit</label>
                                    <select className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50' 
                                        onChange={(e) => setUnit(e.target.value)} value={unit}>
                                        <option value="">Select fallback unit</option>
                                        {units.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-gray-700 font-medium mb-1.5 text-sm'>Short Description</label>
                                <textarea rows={3} placeholder='Highlight key selling points...' 
                                    className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50 resize-none'
                                    onChange={(e) => setDescription(e.target.value)} value={description} />
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-gray-700 font-medium mb-1.5 text-sm'>Expiry Date</label>
                                    <input type="date" className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50'
                                        onChange={(e) => setExpiryDate(e.target.value)} value={expiryDate} />
                                </div>
                                <div>
                                    <label className='block text-gray-700 font-medium mb-1.5 text-sm'>Sort Order</label>
                                    <input type="number" placeholder='0' className='w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50'
                                        onChange={(e) => setSortOrder(Number(e.target.value))} value={sortOrder || ""} />
                                </div>
                            </div>

                            <div>
                                <label className='block text-gray-700 font-medium mb-1.5 text-sm'>Tags</label>
                                <div className='flex flex-wrap gap-2'>
                                    {availableTags.map(tag => (
                                        <button key={tag} type="button" onClick={() => handleTagToggle(tag)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tags.includes(tag) ? 'bg-green-100 border-green-500 text-green-800' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                            {tag.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Variant Builder Section */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className='bg-white shadow-sm rounded-2xl border border-gray-100 p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-lg font-bold text-gray-800 flex items-center gap-2'><Box size={20} className='text-blue-600'/> Variants & Pricing</h2>
                            <span className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full'>Required</span>
                        </div>
                        <p className='text-sm text-gray-500 mb-5'>Add available quantity packs (e.g. 250g, 500g, 1kg). Each product must have at least one variant.</p>
                        
                        <div className='bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 mb-5'>
                            <div className='grid grid-cols-12 gap-3 items-end mb-3'>
                                <div className='col-span-4'>
                                    <label className='block text-gray-600 font-medium mb-1 text-xs'>Weight (grams)</label>
                                    <input type="number" placeholder='e.g., 500' className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400'
                                        onChange={(e) => setVWeightInGrams(e.target.value)} value={vWeightInGrams} />
                                </div>
                                <div className='col-span-3'>
                                    <label className='block text-gray-600 font-medium mb-1 text-xs'>Price (₹)</label>
                                    <input type="number" placeholder='60' className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400'
                                        onChange={(e) => setVPrice(e.target.value)} value={vPrice} />
                                </div>
                                <div className='col-span-3'>
                                    <label className='block text-gray-600 font-medium mb-1 text-xs'>Stock</label>
                                    <input type="number" placeholder='10' className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400'
                                        onChange={(e) => setVStock(e.target.value)} value={vStock} />
                                </div>
                                <div className='col-span-2'>
                                    <button type="button" onClick={addVariant} className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition'>Add</button>
                                </div>
                            </div>
                        </div>

                        {variants.length > 0 ? (
                            <div className='border border-gray-200 rounded-xl overflow-hidden'>
                                <table className='w-full text-left text-sm'>
                                    <thead className='bg-gray-50 text-gray-600 font-medium'>
                                        <tr>
                                                    <th className='py-2 px-3'>Weight (g)</th>
                                            <th className='py-2 px-3'>Price</th>
                                            <th className='py-2 px-3'>Stock Qty</th>
                                            <th className='py-2 px-3 text-right'>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-100'>
                                        <AnimatePresence>
                                            {variants.map((v, i) => (
                                                <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} key={i} className='bg-white'>
                                                    <td className='py-2 px-3 font-medium text-gray-800'>{v.weightInGrams}g</td>
                                                    <td className='py-2 px-3 text-green-600 font-bold'>₹{v.price}</td>
                                                    <td className='py-2 px-3 text-gray-600'>{v.stockQuantity}</td>
                                                    <td className='py-2 px-3 text-right'>
                                                        <button type="button" onClick={() => removeVariant(i)} className='text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition'>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className='text-center py-6 border border-gray-200 border-dashed rounded-xl bg-gray-50/50'>
                                <p className='text-gray-500 text-sm'>No variants added yet. Please add at least one.</p>
                            </div>
                        )}

                        <div className='mt-6 pt-6 border-t border-gray-100'>
                            <label className='block text-gray-700 font-medium mb-1.5 text-sm'>Fallback Reference Price (₹)</label>
                            <input type="text" placeholder='e.g., 120' className='w-full sm:w-1/2 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50'
                                onChange={(e) => setPrice(e.target.value)} value={price} />
                            <p className='text-xs text-gray-400 mt-1'>Used if variants are unsupported by legacy endpoints.</p>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column (Inventory & Media) */}
                <div className='col-span-1 space-y-6'>
                    
                    {/* Inventory & Discount */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className='bg-white shadow-sm rounded-2xl border border-gray-100 p-6'>
                        <h2 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'><span className='text-green-600 font-bold'>₹</span> Marketing</h2>
                        
                        <div className='space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-gray-700 font-medium mb-1 text-sm'>Base Stock</label>
                                    <input type="number" placeholder='100' className='w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-400'
                                        onChange={(e) => setStockQuantity(e.target.value)} value={stockQuantity} />
                                </div>
                                <div>
                                    <label className='block text-gray-700 font-medium mb-1 text-sm'>Stock Unit</label>
                                    <input type="text" placeholder='kg' className='w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-400'
                                        onChange={(e) => setStockUnit(e.target.value)} value={stockUnit} />
                                </div>
                            </div>

                            <div className='border-t border-gray-100 pt-4'>
                                <label className='block text-gray-700 font-medium mb-1 text-sm'>Discount Percentage (%)</label>
                                <input type="number" placeholder='15' max={99} min={0} className='w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-400'
                                    onChange={(e) => setDiscountPercent(Number(e.target.value))} value={discountPercent || ""} />
                            </div>

                            {discountPercent > 0 && variants.length > 0 && (
                                <div className='bg-green-50 rounded-xl p-3 border border-green-100 text-sm'>
                                    <p className='text-green-800 font-medium mb-1'>Preview (Primary Variant)</p>
                                    <div className='flex items-center gap-2'>
                                        <span className='line-through text-gray-400'>₹{variants[0].price}</span>
                                        <span className='font-bold text-green-700'>₹{(Number(variants[0].price) - (Number(variants[0].price) * discountPercent / 100)).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Media */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className='bg-white shadow-sm rounded-2xl border border-gray-100 p-6'>
                        <h2 className='text-lg font-bold text-gray-800 mb-4'>Product Media</h2>
                        
                        <div className='flex flex-col items-center gap-4'>
                            <label htmlFor="image" className='cursor-pointer flex flex-col items-center justify-center gap-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:bg-gray-100 hover:border-green-400 transition-all w-full text-center'>
                                <Upload className='w-8 h-8 text-gray-400' />
                                <div>
                                    <p className='text-green-600 font-semibold'>Click to upload</p>
                                    <p className='text-xs text-gray-500 mt-1'>PNG, JPG up to 5MB</p>
                                </div>
                            </label>
                            <input type="file" id='image' accept='image/*' hidden onChange={handleImageChange} />
                            
                            {preview && (
                                <div className='w-full relative mt-2'>
                                    <Image src={preview} width={300} height={300} alt='image preview' className='w-full h-48 rounded-xl shadow-md border border-gray-200 object-cover' />
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Submit Component */}
                    <div className='pt-2'>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            className='w-full bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-lg tracking-wide'
                        >
                            {loading ? <Loader className='w-6 h-6 animate-spin' /> : "Publish Product"}
                        </motion.button>
                    </div>

                </div>
            </form>
        </div>
    )
}

export default AddGrocery
