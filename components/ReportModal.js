"use client";
import { useState } from "react";
import styles from "./ReportModal.module.css";
import { FaTimes, FaFlag } from "react-icons/fa";

const REPORT_REASONS = [
  { value: "spam", label: "Spam o contenido repetitivo" },
  { value: "inappropriate", label: "Contenido inapropiado" },
  { value: "scam", label: "Estafa o fraude" },
  { value: "fake", label: "Información falsa o engañosa" },
  { value: "prohibited", label: "Producto/servicio prohibido" },
  { value: "harassment", label: "Acoso o comportamiento abusivo" },
  { value: "copyright", label: "Violación de derechos de autor" },
  { value: "other", label: "Otro motivo" }
];

export default function ReportModal({ 
  isOpen, 
  onClose, 
  publicacionId, 
  publicacionTitle,
  ratingId,
  ratingInfo, // { raterName, comment, rating }
  reportedUserId,
  reportedUserInfo // { name, username }
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const isRatingReport = !!ratingId;
  const isPublicationReport = !!publicacionId;
  const isUserReport = !!reportedUserId;



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setMessage({ type: "error", text: "Por favor selecciona una razón para el reporte" });
      return;
    }

    if (selectedReason === "other" && !description.trim()) {
      setMessage({ type: "error", text: "Por favor describe el motivo del reporte" });
      return;
    }

    // Validate that we have either a publicacion, rating, or user ID
    if (!publicacionId && !ratingId && !reportedUserId) {
      setMessage({ type: "error", text: "Error: No se pudo identificar el elemento a reportar" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const requestBody = {
        reason: selectedReason,
        description: description.trim() || null,
      };

      if (publicacionId) {
        requestBody.publicacionId = publicacionId;
      }
      
      if (ratingId) {
        requestBody.ratingId = ratingId;
      }
      
      if (reportedUserId) {
        requestBody.reportedUserId = reportedUserId;
      }

      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        // Reset form
        setSelectedReason("");
        setDescription("");
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error al enviar el reporte. Inténtalo de nuevo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason("");
      setDescription("");
      setMessage(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <FaFlag className={styles.reportIcon} />
            {isRatingReport ? "Reportar Calificación" : isUserReport ? "Reportar Usuario" : "Reportar Publicación"}
          </h2>
          <button 
            className={styles.closeButton} 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.publicacionInfo}>
            {isRatingReport ? (
              <div>
                <p><strong>Calificación de:</strong> {ratingInfo?.raterName}</p>
                {ratingInfo?.comment && (
                  <p><strong>Comentario:</strong> &quot;{ratingInfo.comment}&quot;</p>
                )}
              </div>
            ) : isUserReport ? (
              <div>
                <p><strong>Usuario:</strong> {reportedUserInfo?.name || reportedUserInfo?.username}</p>
                <p><strong>Nombre de usuario:</strong> @{reportedUserInfo?.username}</p>
              </div>
            ) : (
              <p><strong>Publicación:</strong> {publicacionTitle}</p>
            )}
          </div>

          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="reason">
                {isRatingReport ? "¿Por qué reportas esta calificación?" : isUserReport ? "¿Por qué reportas este usuario?" : "¿Por qué reportas esta publicación?"}
              </label>
              <select
                id="reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={isSubmitting}
                className={styles.reasonSelect}
              >
                <option value="">Selecciona una razón</option>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedReason === "other" && (
              <div className={styles.formGroup}>
                <label htmlFor="description">
                  Describe el motivo del reporte
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Proporciona detalles sobre el problema..."
                  rows={4}
                  maxLength={500}
                  disabled={isSubmitting}
                  className={styles.textarea}
                />
                <small className={styles.charCount}>
                  {description.length}/500 caracteres
                </small>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !selectedReason}
              >
                {isSubmitting ? "Enviando..." : "Enviar Reporte"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 