'use client'
import React from 'react'
import { motion } from 'motion/react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import { addToCart } from '@/redux/cartSlice'
import { ChefHat, Plus } from 'lucide-react'

const MEALS = [
  {
    name: "Paneer Butter Masala",
    ingredients: ["paneer", "onion", "tomato", "masala", "cream"],
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "Aloo Gobi",
    ingredients: ["potato", "cauliflower", "onion", "spices"],
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=60",
  }
]

export default function QuickMeals({ groceryList }: { groceryList: any[] }) {
  const dispatch = useDispatch<AppDispatch>()

  const handleAddMeal = (ingredients: string[]) => {
    let addedCount = 0;
    ingredients.forEach(ingredient => {
      // Find matching grocery
      const item = groceryList.find((g: any) => 
        g.name.toLowerCase().includes(ingredient.toLowerCase()) || 
        g.category.toLowerCase().includes(ingredient.toLowerCase())
      )

      if (item) {
        const hasVariants = item.variants && item.variants.length > 0;
        const currentVariant = hasVariants ? item.variants[0] : null;
        const baseId = item._id || item.id || "";
        const uniqueCartId = currentVariant ? `${baseId}_${currentVariant.id}` : baseId;
        const displayPrice = currentVariant ? currentVariant.price : item.price;
        const displayUnit = currentVariant ? (currentVariant.weightInGrams >= 1000 ? `${currentVariant.weightInGrams/1000}kg` : `${currentVariant.weightInGrams}g`) : item.unit;

        dispatch(addToCart({ 
          ...item, 
          _id: uniqueCartId, 
          id: uniqueCartId, 
          productId: baseId,
          variant: currentVariant ? currentVariant.id : undefined,
          weightInGrams: currentVariant ? currentVariant.weightInGrams : undefined,
          price: displayPrice.toString(), 
          unit: displayUnit,
          quantity: 1 
        } as any))
        addedCount++;
      }
    })
    alert(`Added ${addedCount} ingredients to cart!`)
  }

  return (
    <div className='w-[90%] md:w-[80%] mx-auto mt-10 mb-10'>
      <div className='flex items-center gap-2 mb-6 justify-center md:justify-start'>
        <ChefHat className='text-orange-500 w-8 h-8' />
        <h2 className='text-2xl md:text-3xl font-bold text-gray-800'>Quick Meals to Cart</h2>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {MEALS.map((meal, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ scale: 1.02 }}
            className='flex items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all'
          >
            <img src={meal.image} alt={meal.name} className='w-24 h-24 object-cover rounded-xl shadow-sm' />
            <div className='ml-4 flex-1'>
              <h3 className='font-bold text-lg text-gray-800'>{meal.name}</h3>
              <p className='text-xs text-gray-500 mt-1 line-clamp-1'>
                {meal.ingredients.join(', ')}
              </p>
              <button 
                onClick={() => handleAddMeal(meal.ingredients)}
                className='mt-3 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 transition-colors'
              >
                <Plus size={14} /> Add Ingredients
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
