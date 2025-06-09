'use client';

import { useState, useEffect } from 'react';
import styles from './CookieConsent.module.css';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('analyticsEnabled', 'true');
    
    // Trigger immediate effect by dispatching storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'analyticsEnabled',
      newValue: 'true'
    }));
    
    closeModal();
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('analyticsEnabled', 'false');
    
    // Clear any existing analytics data immediately
    sessionStorage.removeItem('analytics_session_id');
    sessionStorage.removeItem('analytics_session_start');
    
    // Trigger immediate effect by dispatching storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'analyticsEnabled',
      newValue: 'false'
    }));
    
    closeModal();
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.overlay} ${isClosing ? styles.closing : ''}`}>
      <div className={`${styles.modal} ${isClosing ? styles.modalClosing : ''}`}>
        <div className={styles.content}>
          <div className={styles.icon}>
            🍪
          </div>
          <div className={styles.text}>
            <h3 className={styles.title}>Política de Cookies</h3>
            <p className={styles.description}>
              Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas 
              para mejorar tu experiencia. Las cookies nos ayudan a recordar tus preferencias y 
              analizar el tráfico del sitio.
            </p>
            <p className={styles.subtext}>
              Al continuar navegando, aceptas nuestra{' '}
              <a href="/politica-privacidad" target="_blank" rel="noopener noreferrer" className={styles.link}>
                Política de Privacidad
              </a>
              {' '}y el uso de cookies.
            </p>
          </div>
          <div className={styles.actions}>
            <button 
              onClick={handleDecline}
              className={`${styles.button} ${styles.declineButton}`}
            >
              Solo esenciales
            </button>
            <button 
              onClick={handleAccept}
              className={`${styles.button} ${styles.acceptButton}`}
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 