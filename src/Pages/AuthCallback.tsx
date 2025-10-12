/**
 * Auth Callback Page
 * TMDB OAuth callback handler
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading');
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Sadece bir kez çalış
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    // URL'den callback parametrelerini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get('request_token');
    const approved = urlParams.get('approved');

    console.log('🔍 AuthCallback - URL params:', { requestToken, approved });

    if (requestToken && approved === 'true') {
      setStatus('loading');
      console.log('✅ AuthCallback - Valid callback detected, waiting for authentication...');
      
      // useAuth hook'u zaten callback'i handle ediyor
      // Success durumunu kontrol et
      const checkAuth = setInterval(() => {
        if (isAuthenticated) {
          console.log('✅ AuthCallback - Authentication successful!');
          setStatus('success');
          clearInterval(checkAuth);
          setTimeout(() => {
            navigate('/lists');
          }, 1500);
        }
      }, 200); // Daha sık kontrol et

      // 15 saniye sonra timeout
      setTimeout(() => {
        clearInterval(checkAuth);
        if (!isAuthenticated) {
          console.log('❌ AuthCallback - Authentication timeout');
          setStatus('error');
        }
      }, 15000);

    } else if (approved === 'false') {
      // Kullanıcı reddetti
      console.log('❌ AuthCallback - User denied authentication');
      setStatus('denied');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      // Geçersiz callback
      console.log('❌ AuthCallback - Invalid callback parameters');
      setStatus('error');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [navigate]); // isAuthenticated'ı dependency'den çıkar
  
  // isAuthenticated değişimini ayrı bir effect'te izle
  useEffect(() => {
    if (isAuthenticated && status === 'loading') {
      console.log('✅ AuthCallback - Authentication state changed to true!');
      setStatus('success');
      setTimeout(() => {
        navigate('/lists');
      }, 1500);
    }
  }, [isAuthenticated, status, navigate]);

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: (
            <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-cyan-500"></div>
          ),
          title: 'Giriş yapılıyor...',
          message: 'TMDB hesabınızla giriş yapılıyor, lütfen bekleyin...',
          color: 'cyan'
        };
      case 'success':
        return {
          icon: (
            <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          title: 'Giriş başarılı!',
          message: 'TMDB hesabınızla başarıyla giriş yaptınız. Listelerinize yönlendiriliyorsunuz...',
          color: 'green'
        };
      case 'denied':
        return {
          icon: (
            <div className="w-24 h-24 mx-auto mb-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          ),
          title: 'Giriş reddedildi',
          message: 'TMDB girişi reddedildi. Ana sayfaya yönlendiriliyorsunuz...',
          color: 'yellow'
        };
      case 'error':
        return {
          icon: (
            <div className="w-24 h-24 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ),
          title: 'Giriş hatası',
          message: 'Giriş sırasında bir hata oluştu. Ana sayfaya yönlendiriliyorsunuz...',
          color: 'red'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {content.icon}
        
        <h2 className="text-2xl font-bold text-white mb-4">
          {content.title}
        </h2>
        
        <p className="text-gray-300 mb-6">
          {content.message}
        </p>

        {status === 'success' && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/lists')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Listelerime Git
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ana Sayfa
            </button>
          </div>
        )}

        {(status === 'error' || status === 'denied') && (
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Ana Sayfaya Git
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
