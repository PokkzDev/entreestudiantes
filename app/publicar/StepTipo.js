import React from 'react';

export default function StepTipo({ form, handleTypeSelect, styles }) {
  return (
    <div className={styles.typeSelectRow}>
      <button
        type="button"
        className={`${styles.publicarButton} ${styles.typeButton} ${form.type === 'producto' ? styles.selectedType : ''}`}
        onClick={() => handleTypeSelect('producto')}
      >
        <span className={styles.typeIcon}>📦</span>
        Producto
      </button>
      <button
        type="button"
        className={`${styles.publicarButton} ${styles.typeButton} ${form.type === 'servicio' ? styles.selectedType : ''}`}
        onClick={() => handleTypeSelect('servicio')}
      >
        <span className={styles.typeIcon}>🛠️</span>
        Servicio
      </button>
    </div>
  );
}
