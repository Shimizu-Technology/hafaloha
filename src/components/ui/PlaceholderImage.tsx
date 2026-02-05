import { ImageOff, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Configuration ────────────────────────────────────────────────────────────
// Easy to swap: change the icon, colors, or opacity in one place.
const PLACEHOLDER_DEFAULTS = {
  icon: ShoppingBag as LucideIcon,
  bgClass: 'bg-warm-100',
  iconColor: 'text-warm-400',
  textColor: 'text-warm-400',
  iconOpacity: 'opacity-50',
  text: 'No Image',
};

// ── Variant presets ──────────────────────────────────────────────────────────
const VARIANT_STYLES = {
  card: {
    iconSize: 'w-12 h-12',
    showText: true,
    textSize: 'text-xs',
    gap: 'gap-2',
  },
  detail: {
    iconSize: 'w-16 h-16',
    showText: true,
    textSize: 'text-base',
    gap: 'gap-3',
  },
  thumbnail: {
    iconSize: 'w-6 h-6',
    showText: false,
    textSize: 'text-xs',
    gap: 'gap-1',
  },
} as const;

// ── Props ────────────────────────────────────────────────────────────────────
interface PlaceholderImageProps {
  /** Layout variant — controls icon size and whether "No Image" text appears. */
  variant?: keyof typeof VARIANT_STYLES;
  /** Extra classes merged onto the outer wrapper. */
  className?: string;
  /** Extra classes merged onto the icon element. */
  iconClassName?: string;
  /** Override the default icon (must be a lucide-react icon component). */
  icon?: LucideIcon;
  /** Override the fallback text (only shown for card / detail variants). */
  text?: string;
}

export default function PlaceholderImage({
  variant = 'card',
  className = '',
  iconClassName = '',
  icon: IconOverride,
  text,
}: PlaceholderImageProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = IconOverride ?? PLACEHOLDER_DEFAULTS.icon;
  const label = text ?? PLACEHOLDER_DEFAULTS.text;

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center ${PLACEHOLDER_DEFAULTS.bgClass} ${className}`}
    >
      <Icon
        className={`${styles.iconSize} ${PLACEHOLDER_DEFAULTS.iconColor} ${PLACEHOLDER_DEFAULTS.iconOpacity} ${iconClassName}`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      {styles.showText && (
        <span
          className={`${styles.textSize} ${PLACEHOLDER_DEFAULTS.textColor} font-medium mt-1 select-none`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// Re-export a handy icon for consumers that want to swap it inline
export { ImageOff, ShoppingBag };
