"use client";
import { getPrivacyPolicy } from '@/lib/legal-content';
import LegalContent from './LegalContent';
import styles from "./modalPrivacidad.module.css";

export default function ModalPrivacidad({ open, onClose }) {
  if (!open) return null;

  const privacyPolicy = getPrivacyPolicy();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar"
        >
          &times;
        </button>
        <div className={styles.contentWrapper}>
          <LegalContent document={privacyPolicy} isModal={true} />
        </div>
      </div>
    </div>
  );
}
