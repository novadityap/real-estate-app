import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: '',
    currentUser: {},
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = {
        ...state.currentUser,
        ...action.payload
      };
    },
    clearAuth: (state) => {
      state.token = '';
      state.currentUser = {};
      state.isAuthenticated = false;
    },
  },
});

export const { 
  setToken, 
  setCurrentUser, 
  clearAuth
} = authSlice.actions;
export default authSlice.reducer;
