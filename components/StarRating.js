import React, { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import styles from './StarRating.module.css';

const StarRating = ({ 
  rating = 0, 
  onRatingChange = null, 
  size = 'medium', 
  readonly = false,
  showCount = false,
  totalRatings = 0 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [tempRating, setTempRating] = useState(rating);

  const handleMouseEnter = (starIndex) => {
    if (!readonly && onRatingChange) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly && onRatingChange) {
      setHoverRating(0);
    }
  };

  const handleClick = (starIndex) => {
    if (!readonly && onRatingChange) {
      setTempRating(starIndex);
      onRatingChange(starIndex);
    }
  };

  const displayRating = hoverRating || tempRating || rating;
  const averageRating = parseFloat(rating) || 0;

  return (
    <div className={`${styles.starRating} ${styles[size]}`}>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isActive = readonly 
            ? starIndex <= Math.round(averageRating)
            : starIndex <= displayRating;
          
          return (
            <span
              key={starIndex}
              className={`${styles.star} ${isActive ? styles.active : ''} ${
                !readonly && onRatingChange ? styles.interactive : ''
              }`}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(starIndex)}
            >
              {isActive ? <FaStar /> : <FaRegStar />}
            </span>
          );
        })}
      </div>
      
      {readonly && showCount && (
        <div className={styles.ratingInfo}>
          <span className={styles.averageRating}>
            {averageRating.toFixed(1)}
          </span>
          <span className={styles.totalRatings}>
            ({totalRatings} {totalRatings === 1 ? 'calificación' : 'calificaciones'})
          </span>
        </div>
      )}
    </div>
  );
};

export default StarRating; 