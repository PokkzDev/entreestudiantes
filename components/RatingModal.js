import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import StarRating from './StarRating';
import styles from './RatingModal.module.css';

const RatingModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onSubmit, 
  existingRating = null,
  isLoading = false 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setError('');
  }, [existingRating, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Por favor, selecciona una calificación');
      return;
    }

    try {
      await onSubmit({ rating, comment });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al enviar la calificación');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {existingRating ? 'Editar calificación' : 'Calificar usuario'}
          </h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.image ? (
              <Image 
                src={user.image} 
                alt={user.name || user.username}
                width={60}
                height={60}
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {(user?.name || user?.username)?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h4 className={styles.userName}>
              {user?.name || user?.username}
            </h4>
            <p className={styles.userUsername}>@{user?.username}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.ratingForm}>
          <div className={styles.ratingSection}>
            <label className={styles.ratingLabel}>
              Tu calificación:
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="large"
              readonly={false}
            />
          </div>

          <div className={styles.commentSection}>
            <label htmlFor="comment" className={styles.commentLabel}>
              Comentario (opcional):
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comparte tu experiencia con este usuario..."
              className={styles.commentTextarea}
              rows={4}
              maxLength={500}
              disabled={isLoading}
            />
            <div className={styles.characterCount}>
              {comment.length}/500
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || rating === 0}
            >
              {isLoading ? 'Enviando...' : (existingRating ? 'Actualizar' : 'Enviar calificación')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal; 