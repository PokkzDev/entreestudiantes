"use client";
import { useRouter } from "next/navigation";
import styles from "./RestrictionModal.module.css";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

export default function RestrictionModal({ isOpen, onClose, restrictionReason, restrictionEndsAt }) {
  const router = useRouter();



  if (!isOpen) return null;

  const formatEndDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Cerrar"
        >
          <FaTimes />
        </button>
        
        <div className={styles.modalIcon}>
          <FaExclamationTriangle />
        </div>
        
        <h2 className={styles.modalTitle}>
          Cuenta con Restricciones
        </h2>
        
        <div className={styles.modalBody}>
          <p className={styles.modalText}>
            Tu cuenta tiene restricciones de publicación actualmente. No puedes crear nuevas publicaciones hasta que se levanten estas restricciones.
          </p>
          
          {restrictionReason && (
            <div className={styles.reasonContainer}>
              <strong>Motivo:</strong>
              <p className={styles.reasonText}>{restrictionReason}</p>
            </div>
          )}
          
          {restrictionEndsAt && (
            <div className={styles.dateContainer}>
              <strong>Las restricciones se levantarán el:</strong>
              <p className={styles.dateText}>{formatEndDate(restrictionEndsAt)}</p>
            </div>
          )}
          
          {!restrictionEndsAt && (
            <div className={styles.contactContainer}>
              <p className={styles.contactText}>
                Para más información sobre estas restricciones, contacta al soporte.
              </p>
            </div>
          )}
        </div>
        
        <div className={styles.modalActions}>
          <button 
            onClick={onClose}
            className={styles.primaryButton}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
} 