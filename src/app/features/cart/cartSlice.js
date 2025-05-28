import { createSlice } from "@reduxjs/toolkit";

const storedCartList =
  localStorage.getItem("cartList") !== null
    ? JSON.parse(localStorage.getItem("cartList"))
    : [];

const initialState = {
  cartList: storedCartList,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const productToAdd = action.payload.product;
      const quantity = Math.max(1, action.payload.num); // prevent quantity < 1

      const productExist = state.cartList.find(
        (item) => item.id === productToAdd.id
      );

      if (productExist) {
        state.cartList = state.cartList.map((item) =>
          item.id === productToAdd.id
            ? { ...productExist, qty: productExist.qty + quantity }
            : item
        );
      } else {
        state.cartList.push({ ...productToAdd, qty: quantity });
      }
    },
    decreaseQty: (state, action) => {
      const productToDecrease = action.payload;
      const productExist = state.cartList.find(
        (item) => item.id === productToDecrease.id
      );

      if (productExist) {
        if (productExist.qty === 1) {
          // if only one item left, remove it
          state.cartList = state.cartList.filter(
            (item) => item.id !== productExist.id
          );
        } else {
          state.cartList = state.cartList.map((item) =>
            item.id === productExist.id
              ? { ...productExist, qty: productExist.qty - 1 }
              : item
          );
        }
      }
    },
    deleteProduct: (state, action) => {
      const productToDelete = action.payload;
      state.cartList = state.cartList.filter(
        (item) => item.id !== productToDelete.id
      );
    },
  },
});

export const cartMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (action.type?.startsWith("cart/")) {
    const cartList = store.getState().cart.cartList;
    localStorage.setItem("cartList", JSON.stringify(cartList));
  }
  return result;
};

export const { addToCart, decreaseQty, deleteProduct } = cartSlice.actions;

export default cartSlice.reducer;
