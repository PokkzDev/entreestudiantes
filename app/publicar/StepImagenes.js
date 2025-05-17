import React from 'react';
import Image from 'next/image';

export default function StepImagenes({ imagePreviews, handleImageChange, handleRemoveImage, uploading, styles }) {
  return (
    <div>
      <label className={styles.publicarLabel}>Sube imágenes (opcional, máximo 4):</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        disabled={uploading || imagePreviews.length >= 4}
        className={styles.publicarInput}
        style={{ marginBottom: 8 }}
      />
      <div className={styles.imagePreviewGrid}>
        {imagePreviews.map((src, idx) => (
          <div key={idx} className={styles.imagePreviewItem}>
            <Image
              src={src}
              alt="preview"
              className={styles.imagePreviewImg}
              width={80}
              height={80}
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(idx)}
              className={styles.imagePreviewDeleteBtn}
              title="Eliminar imagen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {imagePreviews.length >= 4 && (
        <div style={{ color: '#f43f5e', fontSize: '14px', marginTop: '4px' }}>
          Has alcanzado el límite de 4 imágenes.
        </div>
      )}
      {uploading && <div style={{ color: '#6366f1' }}>Subiendo imágenes...</div>}
    </div>
  );
}
