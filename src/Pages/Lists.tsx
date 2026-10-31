/**
 * Lists Page (/lists) — kullanıcının listeleri.
 * Layout (App.tsx) pt-16 + surface-void zeminini sağlar; bu sayfa içerik +
 * SEO ile sınırlıdır. Gerçek etkileşim UserLists bileşenindedir.
 */

import { UserLists } from '../components/Lists/UserLists';
import { useSEO } from '../hooks/useSEO';

const Lists = () => {
  useSEO({
    title: 'Listelerim',
    description: 'TMDB hesabınızla oluşturduğunuz film listelerini görüntüleyin ve yönetin.',
  });

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <UserLists />
    </div>
  );
};

export default Lists;
