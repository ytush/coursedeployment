import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = 24,
  interactive = false,
  onChange,
  className = ''
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  // Calculate the number of full stars, half stars, and empty stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index);
    }
  };
  
  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };
  
  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starIndex = index + 1;
        let starColor = 'text-gray-300'; // Default empty star color
        
        if (hoverRating > 0) {
          // When hovering (interactive mode)
          if (starIndex <= hoverRating) {
            starColor = 'text-yellow-500';
          }
        } else {
          // Normal display
          if (starIndex <= fullStars) {
            starColor = 'text-yellow-500';
          } else if (hasHalfStar && starIndex === fullStars + 1) {
            starColor = 'text-yellow-500';
          }
        }
        
        return (
          <span
            key={index}
            className={`cursor-${interactive ? 'pointer' : 'default'} ${starColor}`}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starIndex)}
          >
            {starIndex <= fullStars ? (
              <Star size={size} fill="currentColor" />
            ) : hasHalfStar && starIndex === fullStars + 1 ? (
              <StarHalf size={size} fill="currentColor" />
            ) : (
              <Star size={size} />
            )}
          </span>
        );
      })}
    </div>
  );
}