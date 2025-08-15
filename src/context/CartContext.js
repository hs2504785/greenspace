"use client";

import { createContext, useContext, useReducer, useCallback } from "react";
import {
  checkCartForSimilarFreeItems,
  checkOrderHistoryForSimilarFreeItems,
  getProductCategory,
} from "@/utils/freeItemValidation";

const CartContext = createContext();

const initialState = {
  items: [],
  total: 0,
  currentSeller: null,
  error: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_TO_CART": {
      const newItem = {
        ...action.payload,
        total: action.payload.price * action.payload.quantity,
        availableQuantity:
          action.payload.availableQuantity || action.payload.quantity || 1,
      };

      // If cart is empty, set the current seller
      if (state.items.length === 0) {
        return {
          ...state,
          items: [newItem],
          total: newItem.total,
          currentSeller: {
            id: action.payload.owner?.id,
            name: action.payload.owner?.name || "Unknown Seller",
            whatsapp_number: action.payload.owner?.whatsapp_number,
            location: action.payload.owner?.location,
          },
          error: null,
        };
      }

      // Check if item is from the same seller
      const newOwnerId = action.payload.owner?.id;
      if (state.currentSeller.id !== newOwnerId) {
        return {
          ...state,
          error: `Items in cart are from ${state.currentSeller.name}. Please clear your cart to add items from a different seller.`,
        };
      }

      // For free items, check if user already has a similar item in cart
      const isFree = action.payload.price === 0;
      if (isFree) {
        const cartCheck = checkCartForSimilarFreeItems(
          state.items,
          action.payload.name
        );

        if (cartCheck.hasConflict) {
          const category = getProductCategory(action.payload.name);
          return {
            ...state,
            error: `You already have "${cartCheck.conflictingItem.name}" in your cart. To ensure fair distribution, you can only claim one free ${category} item per order.`,
          };
        }
      }

      // Update quantity if item exists
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (existingItemIndex > -1) {
        const updatedItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + action.payload.quantity;
            return {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.price,
              availableQuantity:
                action.payload.availableQuantity ||
                item.availableQuantity ||
                item.quantity ||
                1,
            };
          }
          return item;
        });

        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.total, 0),
          error: null,
        };
      }

      // Add new item
      return {
        ...state,
        items: [...state.items, newItem],
        total: state.total + newItem.total,
        error: null,
      };
    }

    case "UPDATE_QUANTITY": {
      // Find the item to validate quantity
      const itemToUpdate = state.items.find(
        (item) => item.id === action.payload.id
      );

      if (itemToUpdate) {
        const maxAllowed = itemToUpdate.availableQuantity || 1;

        if (action.payload.quantity > maxAllowed) {
          return {
            ...state,
            error: `Maximum ${maxAllowed} ${
              itemToUpdate.unit || "kg"
            } available for this item.`,
          };
        }
      }

      const updatedItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          return {
            ...item,
            quantity: action.payload.quantity,
            total: action.payload.quantity * item.price,
          };
        }
        return item;
      });

      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.total, 0),
        error: null,
      };
    }

    case "REMOVE_FROM_CART": {
      const updatedItems = state.items.filter(
        (item) => item.id !== action.payload.id
      );

      // If cart becomes empty, reset current seller
      if (updatedItems.length === 0) {
        return initialState;
      }

      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.total, 0),
        error: null,
      };
    }

    case "CLEAR_CART":
      return initialState;

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = useCallback(
    async (item, quantity = 1, userId = null) => {
      // TEMPORARILY DISABLED: For free items, check order history first
      // if (item.price === 0 && userId) {
      //   try {
      //     const historyCheck = await checkOrderHistoryForSimilarFreeItems(
      //       userId,
      //       item.name
      //     );

      //     if (historyCheck.hasConflict) {
      //       const category = getProductCategory(item.name);
      //       const error = `You've already received a free ${category} item in a previous order (${historyCheck.conflictingOrder.itemName}). To ensure fair distribution, you can only claim one free ${category} item.`;

      //       // Dispatch an error state
      //       dispatch({ type: "SET_ERROR", payload: error });
      //       return {
      //         success: false,
      //         error: error,
      //         currentSeller: state.currentSeller,
      //       };
      //     }
      //   } catch (error) {
      //     console.error("Error checking order history:", error);
      //     // Continue with adding to cart if history check fails
      //   }
      // }

      console.log("[DEBUG] Adding to cart:", item.name, "Price:", item.price);

      dispatch({
        type: "ADD_TO_CART",
        payload: {
          ...item,
          quantity,
        },
      });

      // Return the updated state for error handling
      return {
        success: !state.error,
        error: state.error,
        currentSeller: state.currentSeller,
      };
    },
    [state.error, state.currentSeller]
  );

  const updateQuantity = useCallback((id, quantity) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  }, []);

  const removeFromCart = useCallback((id) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: { id } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value = {
    items: state.items,
    total: state.total,
    currentSeller: state.currentSeller,
    error: state.error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearError,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
