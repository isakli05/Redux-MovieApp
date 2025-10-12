/**
 * useAuth Hook - Redux based
 * Authentication işlemleri için custom hook
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { setLoading, setUser, logout, loadUserFromStorage } from '../redux/slices/authSlice';
import { useCreateRequestTokenMutation, useCreateAccessTokenMutation } from '../api';

// Global flag - tüm hook instance'ları arasında paylaşılır
let globalCallbackProcessing = false;
let globalProcessedToken: string | null = null;

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading, isAuthenticated } = useAppSelector((state) => state.auth);

  const [createRequestToken] = useCreateRequestTokenMutation();
  const [createAccessToken] = useCreateAccessTokenMutation();

  // Local ref'ler - sadece bu instance için
  const isProcessingCallback = useRef(false);
  const hasProcessedCallback = useRef(false);

  // Local storage'dan user yükle
  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  // URL'den callback parametrelerini kontrol et
  useEffect(() => {
    // Sadece callback sayfasında çalış
    if (!window.location.pathname.includes('/auth/callback')) {
      return;
    }

    // Global flag kontrolü - tüm instance'lar arasında paylaşılır
    if (globalCallbackProcessing) {
      console.log('⚠️ Callback already processing globally, skipping');
      return;
    }

    // Zaten işlenmişse tekrar işleme
    if (hasProcessedCallback.current || isProcessingCallback.current) {
      console.log('⚠️ Callback already processed locally, skipping');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get('request_token');
    const approved = urlParams.get('approved');

    console.log('🔍 Callback params:', { requestToken, approved });

    // Aynı token'ı tekrar işleme - global kontrol
    if (requestToken && globalProcessedToken === requestToken) {
      console.log('⚠️ Token already processed globally:', requestToken);
      return;
    }

    // Token varsa ve henüz authenticated değilse işle
    if (requestToken && !isAuthenticated && !globalCallbackProcessing) {
      console.log('✅ Processing callback with token:', requestToken);

      // Hemen flag'leri set et - hem local hem global
      hasProcessedCallback.current = true;
      isProcessingCallback.current = true;
      globalCallbackProcessing = true;
      globalProcessedToken = requestToken;

      handleCallback(requestToken);
    } else if (requestToken && isAuthenticated) {
      console.log('⚠️ Already authenticated, skipping callback');
    } else {
      console.log('❌ No valid token found in callback URL');
    }
  }, []); // Boş dependency array - sadece mount'ta çalış

  const handleCallback = async (requestToken: string) => {
    // Zaten authenticated ise tekrar çağrı yapma
    if (isAuthenticated) {
      console.log('⚠️ Already authenticated, skipping callback');
      isProcessingCallback.current = false;
      return;
    }

    try {
      console.log('🔄 Starting callback process...');
      dispatch(setLoading(true));

      // Step 3: Session oluştur
      console.log('📡 Creating session with token:', requestToken);
      const accessTokenResponse = await createAccessToken({ request_token: requestToken }).unwrap();
      console.log('✅ Session created:', accessTokenResponse);
      console.log('✅ Session response type:', typeof accessTokenResponse);
      console.log('✅ Session response keys:', Object.keys(accessTokenResponse));

      // Response kontrolü - success field olmayabilir
      if (!accessTokenResponse.session_id) {
        console.error('❌ No session_id in response:', accessTokenResponse);
        throw new Error('Session creation failed - no session_id');
      }

      // Kullanıcı bilgilerini kaydet (v3 API)
      const userData = {
        id: 0, // Account details'den gelecek
        username: '', // Account details'den gelecek
        name: '', // Account details'den gelecek
        session_id: accessTokenResponse.session_id,
      };

      console.log('💾 Saving user data:', userData);
      dispatch(setUser(userData));
      localStorage.setItem('tmdb_user', JSON.stringify(userData));

      // URL'den callback parametrelerini temizle
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('✅ Authentication completed successfully');

    } catch (error: any) {
      console.error('❌ Callback error:', error);

      // Hata mesajını göster
      const errorMessage = error?.data?.status_message || error?.message || 'Authentication failed';
      console.error('❌ Error details:', errorMessage);

      // Hata durumunda kullanıcıyı ana sayfaya yönlendir
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } finally {
      dispatch(setLoading(false));
      isProcessingCallback.current = false;
      globalCallbackProcessing = false; // Global flag'i de temizle
    }
  };

  const login = useCallback(async () => {
    try {
      dispatch(setLoading(true));

      // Step 1: Request token oluştur
      const requestTokenResponse = await createRequestToken({
        redirect_to: window.location.origin + '/auth/callback'
      }).unwrap();

      // Step 2: Kullanıcıyı TMDB'ye yönlendir (v3 API)
      const authUrl = `https://www.themoviedb.org/authenticate/${requestTokenResponse.request_token}?redirect_to=${encodeURIComponent(window.location.origin + '/auth/callback')}`;
      console.log('🔗 Redirecting to TMDB:', authUrl);
      window.location.href = authUrl;

    } catch (error) {
      console.error('Login error:', error);
      dispatch(setLoading(false));
    }
  }, [dispatch, createRequestToken]);

  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout: logoutUser,
  };
};
