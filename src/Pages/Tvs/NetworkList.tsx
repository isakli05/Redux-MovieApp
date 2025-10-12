import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGetTVShowsByNetworkQuery } from '../../api/endpoints/tv.endpoints';
import { getPosterUrl, createSlug, formatDate, truncateText } from '../../utils';
import { TMDB_CONFIG } from '../../utils/constants';
import type { Network } from '../../types/tvsDetails';
import Loading from '../../components/Loading';

function NetworkList() {
  const { net_id } = useParams();
  const [network, setNetwork] = useState<Network>();
  
  const { data: networkTvList, isLoading } = useGetTVShowsByNetworkQuery(
    { networkId: net_id! },
    { skip: !net_id }
  );

  useEffect(() => {
    if (!net_id) return;

    // Fetch network details
    fetch(`${TMDB_CONFIG.BASE_URL}/network/${net_id}?api_key=${TMDB_CONFIG.API_KEY}`)
      .then((res) => res.json())
      .then((data) => setNetwork(data))
      .catch((err) => console.error('Network fetch error:', err));
  }, [net_id]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="w-full bg-cyan-900 p-5 mb-5">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            {network?.logo_path ? (
              <img
                loading="lazy"
                className="h-12 rounded-md object-contain bg-white px-4 py-2"
                src={`${TMDB_CONFIG.IMAGE_BASE_URL}${network.logo_path}`}
                alt={network.name}
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-medium text-white">
                {network?.name || 'Network'}
              </h1>
            )}
            <span className="text-white text-xl">
              {networkTvList?.total_results || 0} Dizi
            </span>
          </div>
        </div>
      </div>

      {/* TV Shows List */}
      <div className="container mx-auto px-4">
        <div className="space-y-6">
          {networkTvList?.results.map((tv) => (
            <Link
              key={tv.id}
              to={`/tv/${createSlug(tv.id, tv.original_name)}`}
              className="flex flex-col md:flex-row gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors group"
            >
              {/* Poster */}
              <div className="flex-shrink-0">
                <img
                  loading="lazy"
                  className="h-48 w-32 md:h-36 md:w-24 rounded-md object-cover mx-auto"
                  src={getPosterUrl(tv.poster_path)}
                  alt={tv.name}
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2">
                <h2 className="text-xl md:text-2xl font-medium text-gray-100 group-hover:text-cyan-400 transition-colors">
                  {tv.name}
                </h2>
                <p className="text-gray-400 text-sm">
                  {formatDate(tv.first_air_date)}
                </p>
                {tv.overview && (
                  <p className="leading-relaxed text-gray-300">
                    {truncateText(tv.overview, 260)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {networkTvList?.results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Bu ağa ait dizi bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NetworkList;
