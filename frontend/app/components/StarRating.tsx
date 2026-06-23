interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export default function StarRating({ rating, size = 16, className = '' }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} sur 5`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`full-${i}`} width={size} height={size} viewBox="0 0 20 20" fill="var(--color-accent)">
          <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.05l-4.77 2.51.91-5.33L2.27 6.62l5.34-.78L10 1z" />
        </svg>
      ))}
      {hasHalf && (
        <svg key="half" width={size} height={size} viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="var(--color-accent)" />
              <stop offset="50%" stopColor="var(--color-surface-2)" />
            </linearGradient>
          </defs>
          <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.05l-4.77 2.51.91-5.33L2.27 6.62l5.34-.78L10 1z" fill="url(#halfStar)" />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`empty-${i}`} width={size} height={size} viewBox="0 0 20 20" fill="var(--color-surface-2)">
          <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.05l-4.77 2.51.91-5.33L2.27 6.62l5.34-.78L10 1z" />
        </svg>
      ))}
    </span>
  );
}