/**
 * Auth Slice - Redux Toolkit
 * Authentication state management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  username: string;
  name: string;
  session_id: string; // v3 API'de session_id kullanılıyor
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      // Local storage'dan da temizle
      localStorage.removeItem('tmdb_user');
    },
    // Local storage'dan user yükle
    loadUserFromStorage: (state) => {
      const savedUser = localStorage.getItem('tmdb_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          state.user = userData;
          state.isAuthenticated = true;
        } catch (error) {
          localStorage.removeItem('tmdb_user');
        }
      }
    },
  },
});

export const { setLoading, setUser, logout, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;
