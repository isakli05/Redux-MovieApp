import { useParams } from 'react-router-dom';
import { useGetPersonDetailsQuery } from '../../api/endpoints/persons.endpoints';
import { getProfileUrl, formatDate } from '../../utils';
import Loading from '../../components/Loading';

function PersonDetails() {
  const { cast_id } = useParams();
  
  const { data: cast, isLoading, error } = useGetPersonDetailsQuery(cast_id!, {
    skip: !cast_id,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400 text-xl">Kişi bilgileri yüklenirken bir hata oluştu.</p>
      </div>
    );
  }

  if (isLoading || !cast) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Image */}
          <div className="md:w-1/3">
            <img
              loading="lazy"
              src={getProfileUrl(cast.profile_path)}
              alt={cast.name}
              className="rounded-lg w-full object-cover shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="md:w-2/3 space-y-8">
            <h1 className="text-3xl lg:text-5xl font-bold">
              {cast.name}
            </h1>

            {/* Biography */}
            {cast.biography && (
              <div>
                <h2 className="text-2xl font-semibold mb-3">Biyografi</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {cast.biography}
                </p>
              </div>
            )}

            {/* Personal Info */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Kişisel Bilgiler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-400 mb-1">Bilinen İşi</h3>
                  <p className="text-slate-100">
                    {cast.known_for_department === 'Acting' ? 'Oyuncu' : cast.known_for_department}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-400 mb-1">Cinsiyet</h3>
                  <p className="text-slate-100">
                    {cast.gender === 1 ? 'Kadın' : cast.gender === 2 ? 'Erkek' : 'Belirtilmemiş'}
                  </p>
                </div>

                {cast.birthday && (
                  <div>
                    <h3 className="font-bold text-lg text-slate-400 mb-1">Doğum Tarihi</h3>
                    <p className="text-slate-100">
                      {formatDate(cast.birthday)}
                    </p>
                  </div>
                )}

                {cast.place_of_birth && (
                  <div>
                    <h3 className="font-bold text-lg text-slate-400 mb-1">Doğum Yeri</h3>
                    <p className="text-slate-100">{cast.place_of_birth}</p>
                  </div>
                )}

                {cast.deathday && (
                  <div>
                    <h3 className="font-bold text-lg text-slate-400 mb-1">Vefat Tarihi</h3>
                    <p className="text-slate-100">
                      {formatDate(cast.deathday)}
                    </p>
                  </div>
                )}

                {cast.homepage && (
                  <div>
                    <h3 className="font-bold text-lg text-slate-400 mb-1">Website</h3>
                    <a
                      href={cast.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Websiteyi Ziyaret Et
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonDetails;
