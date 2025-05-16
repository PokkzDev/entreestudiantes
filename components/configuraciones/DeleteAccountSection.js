import React, { useState } from "react";
import styles from "./DeleteAccountSection.module.css";

export default function DeleteAccountSection() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);
    setDeleteAccountError("");
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteAccountError("");
    setDeleteReason("");
  };

  const handleConfirmDelete = async () => {
    setDeleteAccountLoading(true);
    setDeleteAccountError("");
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        setDeleteAccountError(data.error || "Error al eliminar la cuenta. Inténtalo de nuevo.");
      }
    } catch (err) {
      setDeleteAccountError("Error de red. Inténtalo de nuevo.");
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
        Acciones permanentes
      </h2>
      <ul className={styles.actionsList}>
        <li>
          <button
            className={`${styles.actionButton} ${styles.actionButtonEnabled}`}
            onClick={handleDeleteAccountClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Eliminar cuenta
          </button>
        </li>
      </ul>
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Eliminar cuenta</h3>
              <button className={styles.closeButton} onClick={handleCloseDeleteModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.warningIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <p className={styles.modalText}>
                <strong>Advertencia:</strong> Estás a punto de eliminar permanentemente tu cuenta. Esta acción no se puede deshacer.
              </p>
              <p className={styles.modalText}>
                Se eliminará toda tu información incluyendo tus publicaciones y mensajes.
              </p>
              <p className={styles.modalText}>
                ¿Estás seguro de que deseas continuar?
              </p>
              <div className={styles.formGroup}>
                <label htmlFor="deleteReason">Razón de eliminación (opcional):</label>
                <textarea
                  id="deleteReason"
                  className={styles.textarea}
                  placeholder="Ayúdanos a mejorar contándonos por qué eliminas tu cuenta..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                ></textarea>
              </div>
              {deleteAccountError && (
                <div className={styles.errorMsg}>{deleteAccountError}</div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={handleCloseDeleteModal}
                disabled={deleteAccountLoading}
              >
                Cancelar
              </button>
              <button
                className={styles.deleteButton}
                onClick={handleConfirmDelete}
                disabled={deleteAccountLoading}
              >
                {deleteAccountLoading ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
