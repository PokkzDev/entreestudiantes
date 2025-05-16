import React, { useState, useEffect } from "react";
import styles from "./ChangePasswordSection.module.css";

export default function ChangePasswordSection() {
  const [loading, setLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
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

  useEffect(() => {
    setPasswordValidations({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      symbol: /[^A-Za-z0-9]/.test(newPassword),
    });
  }, [newPassword]);

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
        setTimeout(() => {
          const detailsElement = document.querySelector('form.' + styles.passwordForm)?.closest('details');
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
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("");
    setPasswordSuccess(false);
    const form = e.target.closest('form');
    if (form) {
      const detailsElement = form.closest('details');
      if (detailsElement) detailsElement.removeAttribute('open');
    }
  };

  return (
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
  );
}
