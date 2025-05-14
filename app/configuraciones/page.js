"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function ConfiguracionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Validar la contraseña cuando cambia
  useEffect(() => {
    setPasswordValidations({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      symbol: /[^A-Za-z0-9]/.test(newPassword),
    });
  }, [newPassword]);

  if (status === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <div>Cargando...</div>
      </div>
    );
  }

  const handleChangePasswordClick = () => {
    // Función para cuando la funcionalidad esté implementada
    alert("Funcionalidad en desarrollo. Estará disponible próximamente.");
  };

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
        // Si fue exitoso, cerrar sesión y redirigir a la página principal
        signOut({ callbackUrl: "/" });
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordSuccess(false);
    setLoading(true);
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Las contraseñas nuevas no coinciden.");
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setPasswordMessage("Contraseña cambiada exitosamente.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Cerrar el formulario después de 2 segundos tras cambio exitoso
        setTimeout(() => {
          const detailsElement = document.querySelector('form.' + styles.passwordForm).closest('details');
          if (detailsElement) detailsElement.removeAttribute('open');
          setPasswordMessage("");
        }, 2000);
      } else {
        setPasswordMessage(data.error || "Error al cambiar la contraseña.");
      }
    } catch (err) {
      setPasswordMessage("Error de red. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const handleCancelPasswordChange = (e) => {
    // Limpiar los estados
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("");
    setPasswordSuccess(false);
    
    // Cerrar el elemento details
    const form = e.target.closest('form');
    if (form) {
      const detailsElement = form.closest('details');
      if (detailsElement) detailsElement.removeAttribute('open');
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Configuraciones de la cuenta</h1>
        <p className={styles.subtitle}>Administra tu información personal y preferencias de cuenta</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Información personal
        </h2>
        
        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Nombre</div>
            <div className={styles.infoValue}>{session?.user?.name || "No disponible"}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Email</div>
            <div className={styles.infoValue}>{session?.user?.email || "No disponible"}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Nombre de usuario</div>
            <div className={styles.infoValue}>
              <span>{session?.user?.username || "No disponible"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Seguridad de la cuenta
        </h2>
        <ul className={styles.actionsList}>
          <li>
            <details>
              <summary className={`${styles.actionButton} ${styles.actionButtonEnabled}`}> 
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Cambiar contraseña
              </summary>
              <form className={styles.passwordForm} onSubmit={handlePasswordChange}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Contraseña actual</label>
                  <div className={styles.passwordInputWrapper}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      id="currentPassword" 
                      name="currentPassword" 
                      required 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">Nueva contraseña</label>
                  <div className={styles.passwordInputWrapper}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      id="newPassword" 
                      name="newPassword" 
                      required 
                      minLength={6} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  <ul className={styles.passwordValidationList}>
                    <li className={passwordValidations.length ? styles.validationSuccess : styles.validationError}>
                      {passwordValidations.length ? '✓' : '✗'} Al menos 8 caracteres
                    </li>
                    <li className={passwordValidations.uppercase ? styles.validationSuccess : styles.validationError}>
                      {passwordValidations.uppercase ? '✓' : '✗'} Una letra mayúscula
                    </li>
                    <li className={passwordValidations.lowercase ? styles.validationSuccess : styles.validationError}>
                      {passwordValidations.lowercase ? '✓' : '✗'} Una letra minúscula
                    </li>
                    <li className={passwordValidations.number ? styles.validationSuccess : styles.validationError}>
                      {passwordValidations.number ? '✓' : '✗'} Un número
                    </li>
                    <li className={passwordValidations.symbol ? styles.validationSuccess : styles.validationError}>
                      {passwordValidations.symbol ? '✓' : '✗'} Un símbolo
                    </li>
                  </ul>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
                  <div className={styles.passwordInputWrapper}>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      required 
                      minLength={6} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className={styles.buttonRow}>
                  <button type="submit" className={styles.saveButton} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                  <button type="button" className={styles.cancelButton} onClick={handleCancelPasswordChange} disabled={loading}>
                    Cancelar
                  </button>
                </div>
                {passwordMessage && (
                  <div className={passwordSuccess ? styles.successMsg : styles.errorMsg}>{passwordMessage}</div>
                )}
              </form>
            </details>
          </li>
        </ul>
      </section>

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
      </section>
      
      {/* Modal de confirmación para eliminar cuenta */}
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
    </main>
  );
}
