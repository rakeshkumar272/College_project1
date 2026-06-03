import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IGrocery {
   _id: string, // Unique identifier in cart (productId-variant)
   productId: string,
   variant?: string, // e.g., '500g'
   weightInGrams?: number, // e.g., 500, 1000
   name: string,
   category: string,
   price: string,
   unit: string,
   quantity: number,
   image: string,
   createdAt?: string,
   updatedAt?: string
}
interface ICartSlice {
   cartData: IGrocery[],
   subTotal: number,
   deliveryFee: number,
   finalTotal: number,
   addItemsTo: string | null
}


const initialState: ICartSlice = {
   cartData: [],
   subTotal: 0,
   deliveryFee: 40,
   finalTotal: 40,
   addItemsTo: null
}

const calculateTotals = (state: ICartSlice) => {
   state.subTotal = state.cartData.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
   state.deliveryFee = state.subTotal > 100 ? 0 : 40
   state.finalTotal = state.subTotal + state.deliveryFee
}

const cartSlice = createSlice({
   name: "cart",
   initialState,
   reducers: {
      addToCart: (state, action: PayloadAction<IGrocery>) => {
         state.cartData.push(action.payload)
         calculateTotals(state)
      },
      increaseQuantity: (state, action: PayloadAction<string>) => {
         const item = state.cartData.find(i => i._id == action.payload)
         if (item) {
            item.quantity = item.quantity + 1
         }
         calculateTotals(state)
      }
      ,
      decreaseQuantity: (state, action: PayloadAction<string>) => {
         const item = state.cartData.find(i => i._id == action.payload)
         if (item?.quantity && item.quantity > 1) {
            item.quantity = item.quantity - 1
         } else {
            state.cartData = state.cartData.filter(i => i._id !== action.payload)
         }
         calculateTotals(state)
      },
      removeFromCart: (state, action: PayloadAction<string>) => {
         state.cartData = state.cartData.filter(i => i._id !== action.payload)
         calculateTotals(state)
      },
      setAddItemsTo: (state, action: PayloadAction<string | null>) => {
         state.addItemsTo = action.payload;
      },
      clearCart: (state) => {
         state.cartData = [];
         state.subTotal = 0;
         state.deliveryFee = 40;
         state.finalTotal = 40;
         state.addItemsTo = null;
      },
      // To calculate totals safely inside our own extra reducers
      calculateTotals: (state) => {
         calculateTotals(state)
      }
   }
})

export const { addToCart, increaseQuantity, decreaseQuantity, removeFromCart, setAddItemsTo, clearCart } = cartSlice.actions
export default cartSlice.reducer
