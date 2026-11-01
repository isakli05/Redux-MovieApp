/**
 * Cinema Universe — self-contained deep-link button for the Master to mount on
 * detail pages at integration time. Accepts a MediaRef, links to /evren.
 */

import { Button } from '../ui';
import type { ButtonProps } from '../ui';
import { mediaKey, type MediaRef } from '../../lib/mediaRef';

export interface UniverseLinkButtonProps extends Omit<ButtonProps, 'to'> {
  media: MediaRef;
  /** Link label; defaults to the shared Turkish copy. */
  label?: string;
}

export default function UniverseLinkButton({ media, label = 'Evrende gör', ...rest }: UniverseLinkButtonProps) {
  return (
    <Button to={`/evren?focus=${mediaKey(media)}`} variant="outline" size="sm" {...rest}>
      {label}
    </Button>
  );
}
