import { useParams } from 'react-router-dom';
import {
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { useGetPersonDetailsQuery } from '../../api/endpoints/persons.endpoints';
import { getProfileUrl, formatDate } from '../../utils';
import Loading from '../../components/Loading';
import PersonMovies from '../../components/Persons/PersonMovies';

function PersonDetails() {
  const { cast_id } = useParams();
  
  const { data: cast, isLoading, error } = useGetPersonDetailsQuery(cast_id!, {
    skip: !cast_id,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-xl font-semibold">Kişi bilgileri yüklenirken bir hata oluştu</p>
          <p className="text-slate-400">Lütfen daha sonra tekrar deneyin</p>
        </div>
      </div>
    );
  }

  if (isLoading || !cast) {
    return <Loading />;
  }

  const calculateAge = (birthday: string, deathday?: string) => {
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Cinsiyet bazlı renk teması
  const isMale = cast.gender === 2;
  const colorTheme = {
    // Arka plan gradient orbs
    orbLeft: isMale ? 'bg-blue-500/10' : 'bg-purple-500/10',
    orbRight: isMale ? 'bg-cyan-500/10' : 'bg-pink-500/10',
    // Profil görsel efekti
    profileGlow: isMale ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500',
    // İsim ve icon arka plan gradient'i
    iconBg: isMale ? 'from-blue-400 to-cyan-500' : 'from-purple-400 to-pink-500',
    nameGradient: isMale ? 'from-blue-400 to-cyan-400' : 'from-purple-400 to-pink-400',
    // İkon renkleri
    iconColor: isMale ? 'text-blue-400' : 'text-purple-400',
    // Card hover border
    cardHover: isMale ? 'hover:border-blue-500/50' : 'hover:border-purple-500/50',
    // Biyografi gradient çubuğu
    bioBar: isMale ? 'from-blue-400 to-cyan-500' : 'from-purple-400 to-pink-500',
    // Website link rengi
    linkColor: isMale ? 'text-blue-400 hover:text-blue-300' : 'text-purple-400 hover:text-purple-300',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className={`absolute top-0 -left-4 w-96 h-96 ${colorTheme.orbLeft} rounded-full blur-3xl`} />
        <div className={`absolute top-0 -right-4 w-96 h-96 ${colorTheme.orbRight} rounded-full blur-3xl`} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Image */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <div className="relative group">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${colorTheme.profileGlow} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition duration-300`} />
                  <img
                    loading="lazy"
                    src={getProfileUrl(cast.profile_path)}
                    alt={cast.name}
                    className="relative w-full rounded-xl shadow-2xl object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`bg-gradient-to-br ${colorTheme.iconBg} p-3 rounded-xl shadow-lg`}>
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                  <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${colorTheme.nameGradient} bg-clip-text text-transparent`}>
                    {cast.name}
                  </h1>
                </div>
              </div>

              {/* Personal Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Known For */}
                <div className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 ${colorTheme.cardHover} transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-2">
                    <BriefcaseIcon className={`h-5 w-5 ${colorTheme.iconColor}`} />
                    <h3 className="font-semibold text-slate-300">Bilinen İşi</h3>
                  </div>
                  <p className="text-white text-lg font-medium">
                    {cast.known_for_department === 'Acting' ? 'Oyunculuk' : cast.known_for_department}
                  </p>
                </div>

                {/* Gender */}
                <div className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 ${colorTheme.cardHover} transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-2">
                    <UserIcon className={`h-5 w-5 ${colorTheme.iconColor}`} />
                    <h3 className="font-semibold text-slate-300">Cinsiyet</h3>
                  </div>
                  <p className="text-white text-lg font-medium">
                    {cast.gender === 1 ? 'Kadın' : cast.gender === 2 ? 'Erkek' : 'Belirtilmemiş'}
                  </p>
                </div>

                {/* Birthday */}
                {cast.birthday && (
                  <div className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 ${colorTheme.cardHover} transition-all duration-300`}>
                    <div className="flex items-center gap-3 mb-2">
                      <CalendarIcon className={`h-5 w-5 ${colorTheme.iconColor}`} />
                      <h3 className="font-semibold text-slate-300">Doğum Tarihi</h3>
                    </div>
                    <p className="text-white text-lg font-medium">
                      {formatDate(cast.birthday, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      ({calculateAge(cast.birthday, cast.deathday)} yaşında{cast.deathday && ' vefat etti'})
                    </p>
                  </div>
                )}

                {/* Place of Birth */}
                {cast.place_of_birth && (
                  <div className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 ${colorTheme.cardHover} transition-all duration-300`}>
                    <div className="flex items-center gap-3 mb-2">
                      <MapPinIcon className={`h-5 w-5 ${colorTheme.iconColor}`} />
                      <h3 className="font-semibold text-slate-300">Doğum Yeri</h3>
                    </div>
                    <p className="text-white text-lg font-medium">{cast.place_of_birth}</p>
                  </div>
                )}

                {/* Deathday */}
                {cast.deathday && (
                  <div className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 ${colorTheme.cardHover} transition-all duration-300`}>
                    <div className="flex items-center gap-3 mb-2">
                      <HeartIcon className="h-5 w-5 text-red-400" />
                      <h3 className="font-semibold text-slate-300">Vefat Tarihi</h3>
                    </div>
                    <p className="text-white text-lg font-medium">
                      {formatDate(cast.deathday, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}

                {/* Homepage */}
                {cast.homepage && (
                  <div className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 ${colorTheme.cardHover} transition-all duration-300 md:col-span-2`}>
                    <div className="flex items-center gap-3 mb-2">
                      <GlobeAltIcon className={`h-5 w-5 ${colorTheme.iconColor}`} />
                      <h3 className="font-semibold text-slate-300">Website</h3>
                    </div>
                    <a
                      href={cast.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 ${colorTheme.linkColor} transition-colors text-lg font-medium`}
                    >
                      <span>Websiteyi Ziyaret Et</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {/* Biography */}
              {cast.biography && (
                <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-1 h-8 bg-gradient-to-b ${colorTheme.bioBar} rounded-full`} />
                    <h2 className="text-2xl md:text-3xl font-bold text-white">Biyografi</h2>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line text-lg">
                      {cast.biography}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filmography Section */}
          {(cast.movie_credits || cast.tv_credits) && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <PersonMovies
                movieCredits={cast.movie_credits?.cast}
                tvCredits={cast.tv_credits?.cast}
                personName={cast.name}
                isMale={cast.gender === 2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonDetails;
