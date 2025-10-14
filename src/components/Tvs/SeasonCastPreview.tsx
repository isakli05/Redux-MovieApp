import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { SeasonCastMember } from '../../types/seasonCredits';
import { getProfileUrl } from '../../utils';

interface SeasonCastPreviewProps {
  cast: SeasonCastMember[];
  maxVisible?: number;
}

const SeasonCastPreview = memo(function SeasonCastPreview({ cast, maxVisible = 5 }: SeasonCastPreviewProps) {
  if (!cast || cast.length === 0) {
    return null;
  }

  const visibleCast = cast.slice(0, maxVisible);
  const remainingCount = cast.length - maxVisible;

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-sm font-medium">Oyuncular:</span>
      
      <div className="flex items-center -space-x-2">
        {visibleCast.map((member) => (
          <Link
            key={member.id}
            to={`/person/${member.id}`}
            className="relative group"
            title={member.name}
          >
            <img
              src={getProfileUrl(member.profile_path, 'SMALL')}
              alt={member.name}
              className="w-10 h-10 rounded-full border-2 border-slate-800 object-cover
                         group-hover:border-cyan-400 transition-all duration-300
                         group-hover:scale-110 group-hover:z-10"
              loading="lazy"
            />
          </Link>
        ))}
        
        {remainingCount > 0 && (
          <div 
            className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-800 
                       flex items-center justify-center"
            title={`${remainingCount} oyuncu daha`}
          >
            <span className="text-xs text-slate-300 font-semibold">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default SeasonCastPreview;
