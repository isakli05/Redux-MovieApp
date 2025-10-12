/**
 * Lists Page
 * Kullanıcı listeleri sayfası - v4 yeni özellik
 */

import React from 'react';
import { UserLists } from '../components/Lists/UserLists';

const Lists: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="pt-16">
        <UserLists />
      </div>
    </div>
  );
};

export default Lists;
