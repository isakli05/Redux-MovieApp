/**
 * TvFollowButton — kendine yeterli takip düğmesi (Master, dizi detay sayfasına
 * monte eder). Yalnız dizi kimliğini ister; başlık/afiş verilirse olaya taşınır
 * (çevrimdışı panel isim göstermek için bunları kullanır).
 */
import { Button, type ButtonProps } from '../ui/Button';
import { useTracker } from '../../lib/tracker/useTracker';

export interface TvFollowButtonProps extends Omit<ButtonProps, 'children' | 'aria-pressed'> {
  tvId: number;
  /** follow_show olayına yazılır; panel çevrimdışıyken isim/afiş kaynağıdır. */
  title?: string;
  posterPath?: string | null;
  followingLabel?: string;
  followLabel?: string;
}

export default function TvFollowButton({
  tvId,
  title,
  posterPath,
  followLabel = 'Takip Et',
  followingLabel = 'Takiptesin',
  variant = 'outline',
  ...rest
}: TvFollowButtonProps) {
  const { isFollowing, followShow, unfollowShow } = useTracker();
  const following = isFollowing(tvId);

  return (
    <Button
      {...rest}
      variant={variant}
      aria-pressed={following}
      onClick={() =>
        following
          ? unfollowShow(tvId)
          : followShow({ kind: 'tv', id: tvId, title, posterPath: posterPath ?? undefined })
      }
    >
      {following ? followingLabel : followLabel}
    </Button>
  );
}
