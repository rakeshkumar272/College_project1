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
  weightInGrams: number;
  price: number;
  stockQuantity: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
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
  expiryDate?: Date | string,
  tags?: string[],
  sortOrder?: number,
  createdAt?: Date,
  updatedAt?: Date,
  freshnessScore?: number,
  recommendedProducts?: string,
  stockQuantity?: number,
  isReorderPredicted?: boolean // Optional flag for UI
}

function GroceryItemCard({ item }: { item: IGrocery }) {
  const dispatch = useDispatch<AppDispatch>()
  const { cartData } = useSelector((state: RootState) => state.cart)
  
  // Default to first variant's ID to prevent undefined UI state
  const hasVariants = item.variants && item.variants.length > 0;
  const initialVariantId = hasVariants ? item.variants![0].id : "";
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId)
  const [imgSrc, setImgSrc] = useState(item.image || "/images/fallback.png")
  
  const currentVariant = hasVariants ? item.variants!.find(v => v.id === selectedVariantId) || item.variants![0] : null;

  const formatWeight = (grams: number) => {
    if (grams >= 1000) return `${grams / 1000}kg`
    return `${grams}g`
  }

  // Use base data or selected variant data
  const displayPrice = currentVariant ? currentVariant.price : item.price;
  const displayUnit = currentVariant ? formatWeight(currentVariant.weightInGrams || 0) : item.unit;

  // Expiry UI Logic
  const expiryDateObj = item.expiryDate ? new Date(item.expiryDate) : null;
  const now = new Date();
  const isExpiringSoon = expiryDateObj && ((expiryDateObj.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30);
  const formattedExpiry = expiryDateObj ? expiryDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "";
  
  // Construct a unique variant-aware ID for the Cart
  const baseId = item._id || (item as any).id || "";
  const uniqueCartId = currentVariant ? `${baseId}_${currentVariant.id}` : baseId;

  // Stock Logic
  const stockQty = currentVariant ? currentVariant.stockQuantity : (item.stockQuantity || 0);
  const stockStatus = currentVariant ? currentVariant.stockStatus : (stockQty <= 0 ? "OUT_OF_STOCK" : stockQty <= 5 ? "LOW_STOCK" : "IN_STOCK");
  const isOutOfStock = stockStatus === "OUT_OF_STOCK";
  
  // Smart Reorder Logic (Feature 1)
  const showReorderBadge = item.isReorderPredicted;

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
        {isExpiringSoon && (
          <div className='absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1'>
             🏷️ Consume Soon Deal
          </div>
        )}
        <Image 
          src={imgSrc} 
          fill 
          alt={item.name} 
          sizes='(max-width: 768px) 100vw, 25vw' 
          className='object-cover transition-transform duration-500 group-hover:scale-105' 
          unoptimized={true}
          onError={() => {
            setImgSrc("/images/fallback.png");
          }}
        />
        <div className='absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300' />
      </div>
      <div className='p-4 flex flex-col flex-1'>
        <div className='flex justify-between items-start'>
          <p className='text-xs text-gray-500 font-medium mb-1 line-clamp-1'>{item.category}</p>
          {stockStatus === "LOW_STOCK" && (
            <span className='text-[9px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold animate-pulse'>
               ⚠ Only {stockQty} left
            </span>
          )}
        </div>
        <h3 className='font-bold text-gray-800 line-clamp-2 leading-tight min-h-[40px]'>{item.name}</h3>

        {formattedExpiry && (
          <p className='text-[10px] text-gray-500 mt-1 flex items-center gap-1'>
            <span className='w-1.5 h-1.5 rounded-full bg-orange-400'></span>
            Expiry: {formattedExpiry}
          </p>
        )}

        {item.freshnessScore && (
          <p className='text-[10px] text-green-600 mt-0.5 flex items-center gap-1 font-semibold'>
            🌿 Freshness: {item.freshnessScore}%
          </p>
        )}

        {showReorderBadge && (
          <div className='mt-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded-md font-medium w-fit'>
            🔄 You may run low on this soon
          </div>
        )}

        {/* Variant Selectors */}
        {hasVariants ? (
          <div className='mt-2 mb-1 flex flex-col gap-1'>
            <label className='text-[10px] text-gray-500 font-medium uppercase tracking-wider'>Select Weight</label>
            <select 
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className='w-full text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-green-400 focus:bg-green-50 transition-colors cursor-pointer appearance-none'
            >
              {item.variants!.map((variant) => (
                <option key={variant.id} value={variant.id} className='font-medium'>
                  {formatWeight(variant.weightInGrams || 0)} - {variant.stockStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : variant.stockQuantity <= 5 ? `Only ${variant.stockQuantity} left` : 'In Stock'}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className='mt-2 mb-1'>
              <span className='text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md'>{displayUnit}</span>
          </div>
        )}

        <div className='flex items-center justify-between mt-auto pt-3 border-t border-gray-50/50'>
          <div className='flex flex-col'>
            <span className='text-xs text-gray-400 font-medium mb-0.5'>Price</span>
            <span className='text-green-700 font-black text-lg'>₹{displayPrice} <span className='text-sm text-gray-500 font-medium'>for {displayUnit}</span></span>
          </div>

          {!cartItem ? (
            isOutOfStock ? (
              <div className='flex flex-col items-end gap-1'>
                <span className='text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md'>Out of stock</span>
                {item.recommendedProducts && (
                  <span className='text-[9px] text-gray-500 text-right leading-tight max-w-[80px]'>
                    Suggested:<br/>
                    <span className='text-green-600 font-medium truncate block'>{item.recommendedProducts.split(',')[0]}</span>
                  </span>
                )}
              </div>
            ) : (
              <motion.button 
                className='flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-bold transition-all shadow-md shadow-green-200'
                whileTap={{ scale: 0.94 }}
                onClick={() => dispatch(addToCart({ 
                  ...item, 
                  _id: uniqueCartId, 
                  id: uniqueCartId, 
                  productId: baseId,
                  variant: currentVariant ? currentVariant.id : undefined,
                  weightInGrams: currentVariant ? currentVariant.weightInGrams : undefined,
                  price: displayPrice.toString(), 
                  unit: displayUnit,
                  quantity: 1,
                  stockQuantity: stockQty // Pass stock info to cart
                } as any))}
              >
                <Plus size={16} strokeWidth={3} /> Add
              </motion.button>
            )
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
              <button 
                disabled={cartItem.quantity >= stockQty}
                className={`w-7 h-7 flex items-center justify-center rounded-lg shadow-sm transition-all text-white \${cartItem.quantity >= stockQty ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`} 
                onClick={() => dispatch(increaseQuantity(uniqueCartId))}
              >
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

