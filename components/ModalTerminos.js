"use client";
import { getTermsOfService } from '@/lib/legal-content';
import LegalContent from './LegalContent';
import styles from "./modalTerminos.module.css";

export default function ModalTerminos({ open, onClose }) {
  if (!open) return null;

  const termsOfService = getTermsOfService();

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
          <LegalContent document={termsOfService} isModal={true} />
        </div>
      </div>
    </div>
  );
}
