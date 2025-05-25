"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./DeleteAccountSection.module.css";

export default function DeleteAccountSection() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [reason, setReason] = useState("");
  const router = useRouter();

  const handleDeleteRequest = () => {
    setShowConfirmation(true);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmText("");
    setReason("");
    setMessage("");
  };

  const handleDeleteConfirm = async () => {
    if (confirmText.toLowerCase() !== "eliminar") {
      setMessage("Debes escribir 'eliminar' para confirmar");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          reason: reason || "Usuario solicitó eliminación de cuenta" 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Cuenta eliminada exitosamente. Cerrando sesión...");
        setMessageType("success");
        
        // Wait a moment to show the success message, then sign out and redirect
        setTimeout(async () => {
          try {
            // Sign out and redirect to home page
            await signOut({ 
              callbackUrl: "/",
              redirect: true 
            });
          } catch (signOutError) {
            console.error("Error during sign out:", signOutError);
            // Fallback: force redirect to home page
            window.location.href = "/";
          }
        }, 2000);
      } else {
        setMessage(data.error || "Error al eliminar la cuenta");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage("Error de red al eliminar la cuenta");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Eliminar Cuenta</h3>
      <p className={styles.sectionDescription}>
        Una vez que elimines tu cuenta, no hay vuelta atrás. Esta acción es permanente.
      </p>

      {!showConfirmation ? (
        <div className={styles.warningBox}>
          <div className={styles.warningIcon}>⚠️</div>
          <div>
            <h4 className={styles.warningTitle}>¿Estás seguro?</h4>
            <p className={styles.warningText}>
              Al eliminar tu cuenta se perderán permanentemente:
            </p>
            <ul className={styles.warningList}>
              <li>Tu perfil y información personal</li>
              <li>Todas tus publicaciones</li>
              <li>Todas las imágenes asociadas</li>
              <li>Tu historial de actividad</li>
              <li>Cualquier contenido asociado</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className={styles.confirmationBox}>
          <h4 className={styles.confirmationTitle}>Confirmar eliminación</h4>
          <p className={styles.confirmationText}>
            Para confirmar la eliminación de tu cuenta, escribe{" "}
            <strong>&quot;eliminar&quot;</strong> en el campo de abajo:
          </p>
          
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe 'eliminar' para confirmar"
              className={styles.confirmInput}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="reason" className={styles.label}>
              Razón de eliminación (opcional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="¿Por qué quieres eliminar tu cuenta? (opcional)"
              className={styles.reasonTextarea}
              disabled={loading}
              rows={3}
            />
          </div>

          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={loading || confirmText.toLowerCase() !== "eliminar"}
              className={styles.deleteButton}
            >
              {loading ? "Eliminando..." : "Eliminar Cuenta"}
            </button>
          </div>
        </div>
      )}

      {!showConfirmation && (
        <button
          type="button"
          onClick={handleDeleteRequest}
          className={styles.deleteButton}
        >
          Eliminar mi cuenta
        </button>
      )}
    </div>
  );
}
