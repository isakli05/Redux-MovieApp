/**
 * User Lists Component
 * Kullanıcının listelerini görüntüleme ve yönetme
 */

import React, { useState } from 'react';
import { useGetUserListsQuery, useDeleteListMutation, List } from '../../api';
import { CreateListModal } from './CreateListModal';
import { useAuth } from '../../hooks/useAuth';

export const UserLists: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user, isAuthenticated, login } = useAuth();
  const { data: listsData, isLoading, error } = useGetUserListsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [deleteList] = useDeleteListMutation();
  
  // API response'u normalize et - array veya object.results olabilir
  const lists = Array.isArray(listsData) 
    ? listsData 
    : ((listsData as any)?.results || []);

  const handleDeleteList = async (listId: string) => {
    if (window.confirm('Bu listeyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteList(listId).unwrap();
      } catch (error) {
        console.error('Liste silme hatası:', error);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Giriş Yapmanız Gerekiyor</h3>
          <p className="text-gray-500 mb-6">Listelerinizi oluşturmak ve yönetmek için TMDB hesabınızla giriş yapın.</p>
          <button
            onClick={login}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            TMDB ile Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Listeler yüklenirken hata oluştu.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Listelerim</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Liste
        </button>
      </div>

      {!lists || lists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz liste oluşturmadınız</h3>
          <p className="text-gray-500 mb-6">Favori film ve dizilerinizi organize etmek için bir liste oluşturun.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk Listenizi Oluşturun
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list: List) => (
            <div key={list.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 truncate">
                    {list.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {list.public ? (
                      <span className="text-green-600 text-sm">🌐 Herkese Açık</span>
                    ) : (
                      <span className="text-gray-500 text-sm">🔒 Özel</span>
                    )}
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Listeyi Sil"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {list.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {list.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{list.item_count} öğe</span>
                  <span>Oluşturan: {list.created_by}</span>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition-colors text-sm">
                    Görüntüle
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm">
                    Düzenle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Liste oluşturulduktan sonra sayfayı yenile
          window.location.reload();
        }}
      />
    </div>
  );
};
