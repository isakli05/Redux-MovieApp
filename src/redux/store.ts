/**
 * Redux Store Configuration
 * RTK Query ile güncellenmiş modern store yapılandırması
 */

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { tmdbApi } from '../api/tmdb.api';

export const store = configureStore({
  reducer: {
    // RTK Query API reducer
    [tmdbApi.reducerPath]: tmdbApi.reducer,
    
    // Eğer local state slice'ları olacaksa buraya eklenebilir
    // Örneğin: favorites, theme, ui state vb.
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tmdbApi.middleware),
});

// Store types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
