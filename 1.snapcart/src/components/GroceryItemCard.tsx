'use client'
import React, { useState } from 'react'
import { motion } from "motion/react"
import Image from 'next/image'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { addToCart, decreaseQuantity, increaseQuantity } from '@/redux/cartSlice'

interface IGroceryVariant {
  id: string;
  label: string;
  price: number;
  stock: number;
}

interface IGrocery {
  _id?: string,
  id?: string,
  name: string,
  category: string,
  price: string,
  unit: string,
  image: string,
  variants?: IGroceryVariant[],
  createdAt?: Date,
  updatedAt?: Date
}

function GroceryItemCard({ item }: { item: IGrocery }) {
  const dispatch = useDispatch<AppDispatch>()
  const { cartData } = useSelector((state: RootState) => state.cart)
  
  // Variant Selection State
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  
  const hasVariants = item.variants && item.variants.length > 0;
  const currentVariant = hasVariants ? item.variants![selectedVariantIndex] : null;

  // Use base data or selected variant data
  const displayPrice = currentVariant ? currentVariant.price : item.price;
  const displayUnit = currentVariant ? currentVariant.label : item.unit;
  
  // Construct a unique variant-aware ID for the Cart
  const baseId = item._id || (item as any).id || "";
  const uniqueCartId = currentVariant ? `${baseId}-${currentVariant.id}` : baseId;

  // Find if this specific variant size is in the cart
  const cartItem = cartData.find(i => (i._id && i._id.toString() === uniqueCartId.toString()) || ((i as any).id && (i as any).id.toString() === uniqueCartId.toString()))

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: false, amount: 0.3 }}
      className='bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col'
    >
      <div className='relative w-full aspect-4/3 bg-gray-50 overflow-hidden group'>
        <Image src={item.image} fill alt={item.name} sizes='(max-width: 768px) 100vw, 25vw' className='object-contain p-4 transition-transform duration-500 group-hover:scale-105' />
        <div className='absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300' />
      </div>
      <div className='p-4 flex flex-col flex-1'>
        <p className='text-xs text-gray-500 font-medium mb-1 line-clamp-1'>{item.category}</p>
        <h3 className='font-bold text-gray-800 line-clamp-2 leading-tight min-h-[40px]'>{item.name}</h3>

        {/* Variant Selectors */}
        {hasVariants ? (
          <div className='flex flex-wrap gap-2 mt-3 mb-1'>
            {item.variants!.map((variant, idx) => (
              <button 
                key={variant.id}
                onClick={() => setSelectedVariantIndex(idx)}
                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                  selectedVariantIndex === idx 
                    ? 'bg-green-50 border-green-500 text-green-700' 
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        ) : (
          <div className='mt-3 mb-1'>
              <span className='text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md'>{displayUnit}</span>
          </div>
        )}

        <div className='flex items-center justify-between mt-auto pt-3 border-t border-gray-50/50'>
          <div className='flex flex-col'>
            <span className='text-xs text-gray-400 font-medium mb-0.5'>Price</span>
            <span className='text-green-700 font-black text-lg'>₹{displayPrice}</span>
          </div>

          {!cartItem ? (
            <motion.button 
              className='flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-bold transition-all shadow-md shadow-green-200'
              whileTap={{ scale: 0.94 }}
              onClick={() => dispatch(addToCart({ 
                ...item, 
                _id: uniqueCartId, 
                id: uniqueCartId, 
                productId: baseId,
                variant: currentVariant ? currentVariant.label : undefined,
                price: displayPrice.toString(), 
                unit: displayUnit,
                quantity: 1 
              } as any))}
            >
              <Plus size={16} strokeWidth={3} /> Add
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className='flex items-center justify-between bg-green-50 border border-green-200 rounded-xl py-1.5 px-2 gap-3 shadow-inner'
            >
              <button className='w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-sm border border-green-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all text-green-600' onClick={() => dispatch(decreaseQuantity(uniqueCartId))}>
                <Minus size={16} strokeWidth={2.5}/>
              </button>
              <span className='text-sm font-bold text-gray-800 tabular-nums w-4 text-center'>{cartItem.quantity}</span>
              <button className='w-7 h-7 flex items-center justify-center rounded-lg bg-green-600 shadow-sm hover:bg-green-700 transition-all text-white' onClick={() => dispatch(increaseQuantity(uniqueCartId))}>
                <Plus size={16} strokeWidth={2.5}/>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default GroceryItemCard
