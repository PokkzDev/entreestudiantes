"use client";

import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from "./ChangePasswordSection.module.css";

export default function ChangePasswordSection() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });

  // Update password validations in real-time
  useEffect(() => {
    setPasswordValidations({
      length: formData.newPassword.length >= 8,
      uppercase: /[A-Z]/.test(formData.newPassword),
      lowercase: /[a-z]/.test(formData.newPassword),
      number: /[0-9]/.test(formData.newPassword),
      symbol: /[^A-Za-z0-9]/.test(formData.newPassword),
    });
  }, [formData.newPassword]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Enhanced validation using the same logic as registration
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Las nuevas contraseñas no coinciden");
      setMessageType("error");
      setLoading(false);
      return;
    }

    // Check all password requirements
    if (!(
      formData.newPassword.length >= 8 &&
      /[A-Z]/.test(formData.newPassword) &&
      /[a-z]/.test(formData.newPassword) &&
      /[0-9]/.test(formData.newPassword) &&
      /[^A-Za-z0-9]/.test(formData.newPassword)
    )) {
      setMessage("La contraseña debe cumplir con todos los requisitos de seguridad");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Contraseña actualizada exitosamente");
        setMessageType("success");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setMessage(data.error || "Error al cambiar la contraseña");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error al cambiar la contraseña");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Cambiar Contraseña</h3>
      <p className={styles.sectionDescription}>
        Actualiza tu contraseña para mantener tu cuenta segura
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="currentPassword" className={styles.label}>
            Contraseña Actual
          </label>
          <div className={styles.passwordInputContainer}>
            <input
              type={showCurrentPassword ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Ingresa tu contraseña actual"
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="newPassword" className={styles.label}>
            Nueva Contraseña
          </label>
          <div className={styles.passwordInputContainer}>
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Ingresa tu nueva contraseña"
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {/* Password validation indicators */}
          <div className={styles.passwordValidations}>
            <div className={`${styles.validationItem} ${passwordValidations.length ? styles.valid : styles.invalid}`}>
              <span className={styles.validationIcon}>
                {passwordValidations.length ? '✔' : '✖'}
              </span>
              Al menos 8 caracteres
            </div>
            <div className={`${styles.validationItem} ${passwordValidations.uppercase ? styles.valid : styles.invalid}`}>
              <span className={styles.validationIcon}>
                {passwordValidations.uppercase ? '✔' : '✖'}
              </span>
              Una letra mayúscula
            </div>
            <div className={`${styles.validationItem} ${passwordValidations.lowercase ? styles.valid : styles.invalid}`}>
              <span className={styles.validationIcon}>
                {passwordValidations.lowercase ? '✔' : '✖'}
              </span>
              Una letra minúscula
            </div>
            <div className={`${styles.validationItem} ${passwordValidations.number ? styles.valid : styles.invalid}`}>
              <span className={styles.validationIcon}>
                {passwordValidations.number ? '✔' : '✖'}
              </span>
              Un número
            </div>
            <div className={`${styles.validationItem} ${passwordValidations.symbol ? styles.valid : styles.invalid}`}>
              <span className={styles.validationIcon}>
                {passwordValidations.symbol ? '✔' : '✖'}
              </span>
              Un símbolo
            </div>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirmar Nueva Contraseña
          </label>
          <div className={styles.passwordInputContainer}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Confirma tu nueva contraseña"
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? "Actualizando..." : "Cambiar Contraseña"}
        </button>
      </form>
    </div>
  );
}
