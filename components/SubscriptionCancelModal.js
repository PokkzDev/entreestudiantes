"use client";
import { useState } from "react";
import styles from "./SubscriptionCancelModal.module.css";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

const CANCELLATION_REASONS = [
  { value: "too_expensive", label: "Muy caro para mi presupuesto" },
  { value: "not_using", label: "No estoy usando las funciones premium" },
  { value: "found_alternative", label: "Encontré una alternativa mejor" },
  { value: "temporary_break", label: "Necesito un descanso temporal" },
  { value: "technical_issues", label: "Problemas técnicos con la plataforma" },
  { value: "poor_support", label: "Servicio al cliente insatisfactorio" },
  { value: "missing_features", label: "Faltan funciones que necesito" },
  { value: "switching_schools", label: "Cambiando de universidad" },
  { value: "graduating", label: "Me gradúo pronto" },
  { value: "other", label: "Otro motivo" }
];

export default function SubscriptionCancelModal({ isOpen, onClose, onConfirm, userTier }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      return;
    }

    setIsSubmitting(true);

    try {
      const reasonText = selectedReason === "other" 
        ? description.trim() || "Otro motivo - sin detalles"
        : CANCELLATION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

      await onConfirm(reasonText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason("");
      setDescription("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <FaExclamationTriangle className={styles.warningIcon} />
            Cancelar Suscripción
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
          <div className={styles.warningInfo}>
            <div className={styles.warningContent}>
              <h3>⚠️ Antes de continuar...</h3>
              <ul>
                <li>Tu cuenta será cambiada al plan gratuito inmediatamente</li>
                <li>Perderás acceso a todas las funciones premium</li>
                <li>Esta acción no se puede deshacer</li>
                <li>Podrás volver a suscribirte en cualquier momento</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="reason">
                Ayúdanos a mejorar: ¿Por qué cancelas tu suscripción?
                <span className={styles.optional}>(Opcional pero muy valioso para nosotros)</span>
              </label>
              <select
                id="reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={isSubmitting}
                className={styles.reasonSelect}
              >
                <option value="">Prefiero no decir</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedReason === "other" && (
              <div className={styles.formGroup}>
                <label htmlFor="description">
                  Comparte más detalles (opcional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tu feedback nos ayuda a mejorar la plataforma..."
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
                Mantener Suscripción
              </button>
              <button
                type="submit"
                className={styles.confirmButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Cancelando..." : "Sí, Cancelar Suscripción"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 