"use client";

import styles from "./BackToTopButton.module.css";

export default function BackToTopButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.backToTop}>
      <button 
        onClick={scrollToTop} 
        className={styles.backButton}
      >
        ↑ Volver arriba
      </button>
    </div>
  );
} 