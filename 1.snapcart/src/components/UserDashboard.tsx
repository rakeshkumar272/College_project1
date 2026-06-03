'use client'
import React, { useState, useEffect } from 'react'
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import GroceryItemCard from './GroceryItemCard'
import QuickMeals from './QuickMeals'
import { useDispatch, useSelector } from 'react-redux'

function UserDashboard({ groceryList }: { groceryList: any[] }) {
  const plainGrocery = JSON.parse(JSON.stringify(groceryList))
  
  const dispatch = useDispatch();
  const { cartData } = useSelector((state: any) => state.cart);

  useEffect(() => {
    // Check for products in the cart that no longer exist in the database
    if (cartData && cartData.length > 0) {
      const activeProductIds = new Set();
      const activeVariantIds = new Set();
      plainGrocery.forEach((g: any) => {
        activeProductIds.add(g.id || g._id);
        if (g.variants) {
          g.variants.forEach((v: any) => activeVariantIds.add(v.id || v._id));
        }
      });

      cartData.forEach((cartItem: any) => {
        const baseId = cartItem.productId || cartItem._id?.split('_')[0] || cartItem.id?.split('_')[0];
        const hasVariant = !!cartItem.variant;
        
        let isValid = false;
        if (baseId && activeProductIds.has(baseId)) {
            if (hasVariant) {
                isValid = activeVariantIds.has(cartItem.variant);
            } else {
                isValid = true;
            }
        }

        if (!isValid) {
          console.warn(`Removing deleted product/variant from cart: ${cartItem.name}`);
          dispatch({ type: "cart/removeFromCart", payload: cartItem._id || cartItem.id });
        }
      });
    }
  }, [plainGrocery, cartData, dispatch]);

  const availableTags = ["PRICE_DROP", "BESTSELLER", "GOURMET", "IMPORTED"]
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const handleFilterToggle = (tag: string) => {
    if (activeFilter === tag) {
      setActiveFilter(null)
    } else {
      setActiveFilter(tag)
    }
  }

  // Sort and filter logic
  let filteredProducts = !activeFilter 
    ? plainGrocery 
    : plainGrocery.filter((product: any) => product.tags?.includes(activeFilter))
      
  // Apply sorting by sortOrder if available
  filteredProducts = filteredProducts.sort((a: any, b: any) => (b.sortOrder || 0) - (a.sortOrder || 0))

  return (
    <>
      <HeroSection />
      <CategorySlider />
      <QuickMeals groceryList={plainGrocery} />
      <div className='w-[90%] md:w-[80%] mx-auto mt-10 mb-20'>
        <h2 className='text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center'>Popular Grocery Items</h2>
        
        {/* Filter Bar */}
        <div className='flex flex-wrap justify-center gap-3 mb-8'>
          {availableTags.map(tag => (
            <button 
              key={tag}
              onClick={() => handleFilterToggle(tag)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeFilter === tag 
                ? 'bg-green-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tag.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'>
          {filteredProducts.map((item: any, index: number) => (
            <GroceryItemCard key={index} item={item} />
          ))}
        </div>
      </div>
    </>
  )
}

export default UserDashboard
