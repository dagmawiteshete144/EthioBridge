
import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, onRate, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: 16, md: 22, lg: 28 };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={`transition-colors p-0.5 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            size={sizes[size] || sizes.md}
            strokeWidth={2}
            className={(hovered || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}
          />
        </button>
      ))}
      {rating > 0 && <span className="ml-2 text-sm text-gray-500 self-center">{rating}/5</span>}
    </div>
  );
}
