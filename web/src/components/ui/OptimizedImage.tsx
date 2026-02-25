import { memo } from 'react';
import type { ImgixImageOptions, ImageContext } from '../../utils/imageUtils';
import { getImgixImageUrl, getSizesForContext, getWidthsForContext } from '../../utils/imageUtils';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | undefined | null;
  imgixOptions?: ImgixImageOptions;
  context?: ImageContext;
  widths?: number[];
  sizes?: string;
  fallbackSrc?: string;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

const OptimizedImage = memo(({
  src,
  imgixOptions,
  context,
  widths,
  sizes,
  fallbackSrc,
  priority = false,
  fetchPriority,
  alt = '',
  onError,
  ...imgProps
}: OptimizedImageProps) => {
  const resolvedSrc = src || fallbackSrc;
  if (!resolvedSrc) return null;

  const resolvedWidths = widths || getWidthsForContext(context);
  const resolvedSizes = sizes || getSizesForContext(context);

  const baseOptions: ImgixImageOptions = {
    auto: 'format,compress',
    ...imgixOptions,
  };

  const srcSet = resolvedWidths
    .map((width) => {
      const url = getImgixImageUrl(resolvedSrc, { ...baseOptions, width });
      return url ? `${url} ${width}w` : null;
    })
    .filter(Boolean)
    .join(', ');

  const defaultSrc = getImgixImageUrl(resolvedSrc, { ...baseOptions, width: resolvedWidths[0] }) || resolvedSrc;

  const loading = priority ? 'eager' : 'lazy';

  return (
    <img
      src={defaultSrc}
      srcSet={srcSet || undefined}
      sizes={srcSet ? resolvedSizes : undefined}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={(event) => {
        if (fallbackSrc && (event.currentTarget.src || '') !== fallbackSrc) {
          event.currentTarget.src = fallbackSrc;
        }
        onError?.(event);
      }}
      {...imgProps}
    />
  );
});

export default OptimizedImage;
