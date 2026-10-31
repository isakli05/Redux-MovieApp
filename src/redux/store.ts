/**
 * Redux Store Configuration
 * RTK Query ile güncellenmiş modern store yapılandırması
 */

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { tmdbApi } from '../api/tmdb.api';
import { userApi } from '../api/user.api';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    // RTK Query API reducer
    [tmdbApi.reducerPath]: tmdbApi.reducer,

    // User-surface BFF API reducer (lists/auth/account — decision D1)
    [userApi.reducerPath]: userApi.reducer,

    // Auth state
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tmdbApi.middleware, userApi.middleware),
});

// Store types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
