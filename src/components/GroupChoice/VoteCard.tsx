/**
 * Aday kartı — oylama fazında herkesin gördüğü ortak aday setinden bir kart.
 * Dört oy: strong (çok isterim), like (izlerim), skip (pas), dislike (veto).
 */

import { Link } from 'react-router-dom';
import { HeartIcon, HandThumbUpIcon, MinusIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import type { Candidate, VoteValue } from '../../lib/group/api';
import { getImageUrl } from '../../utils';

const VOTE_BUTTONS: Array<{
  value: VoteValue;
  label: string;
  Icon: typeof HeartIcon;
  activeClass: string;
}> = [
  { value: 'strong', label: 'Çok isterim', Icon: HeartIcon, activeClass: 'border-accent bg-surface-overlay text-accent' },
  { value: 'like', label: 'İzlerim', Icon: HandThumbUpIcon, activeClass: 'border-accent bg-surface-overlay text-accent' },
  { value: 'skip', label: 'Pas', Icon: MinusIcon, activeClass: 'border-line-strong bg-surface-overlay text-primary' },
  { value: 'dislike', label: 'Veto', Icon: NoSymbolIcon, activeClass: 'border-danger bg-surface-overlay text-danger' },
];

interface VoteCardProps {
  candidate: Candidate;
  myVote: VoteValue | undefined;
  onVote: (key: string, value: VoteValue) => void;
  disabled?: boolean;
}

export function VoteCard({ candidate, myVote, onVote, disabled }: VoteCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface-raised">
      <div className="flex gap-3 p-3">
        <Link
          to={`/${candidate.kind}/${candidate.id}`}
          className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`${candidate.title} detay sayfası`}
        >
          <img
            src={getImageUrl(candidate.posterPath, 'w185')}
            alt=""
            loading="lazy"
            width={92}
            height={138}
            className="h-[138px] w-[92px] rounded-md object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base text-primary" title={candidate.title}>
            {candidate.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {candidate.year ?? '—'} · TMDB {candidate.voteAverage.toFixed(1)}
          </p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-secondary">
            {candidate.overview || 'Açıklama yok.'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 border-t border-line p-2">
        {VOTE_BUTTONS.map(({ value, label, Icon, activeClass }) => {
          const active = myVote === value;
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              aria-label={`${candidate.title} — ${label}`}
              onClick={() => onVote(candidate.key, value)}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md border px-1 py-1.5 text-[10px] font-medium transition-colors duration-150 ease-cine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
                active ? activeClass : 'border-transparent bg-surface-overlay text-secondary hover:border-line-strong hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </article>
  );
}
