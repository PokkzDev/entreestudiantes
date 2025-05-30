"use client";

import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from "./ChangePasswordSection.module.css";
import buttonStyles from "@/styles/buttons.module.css";

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
      <div className={styles.form}>
        {/* Current Password Section */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionTitle}>Contraseña actual</h4>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword" className={styles.label}>
              Contraseña actual
            </label>
            <div className={styles.passwordContainer}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className={styles.passwordInput}
                placeholder="Ingresa tu contraseña actual"
              />
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </div>

        {/* New Password Section */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionTitle}>Nueva contraseña</h4>
          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  Nueva contraseña
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className={styles.passwordInput}
                    placeholder="Ingresa tu nueva contraseña"
                  />
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirmar nueva contraseña
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={styles.passwordInput}
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Password validation using semaforo style */}
          <ul className={styles.passwordValidations}>
            <li className={passwordValidations.length ? styles.valid : styles.invalid}>
              {passwordValidations.length ? '✔' : '✖'} Al menos 8 caracteres
            </li>
            <li className={passwordValidations.uppercase ? styles.valid : styles.invalid}>
              {passwordValidations.uppercase ? '✔' : '✖'} Una letra mayúscula
            </li>
            <li className={passwordValidations.lowercase ? styles.valid : styles.invalid}>
              {passwordValidations.lowercase ? '✔' : '✖'} Una letra minúscula
            </li>
            <li className={passwordValidations.number ? styles.valid : styles.invalid}>
              {passwordValidations.number ? '✔' : '✖'} Un número
            </li>
            <li className={passwordValidations.symbol ? styles.valid : styles.invalid}>
              {passwordValidations.symbol ? '✔' : '✖'} Un símbolo
            </li>
          </ul>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
          </div>
        )}

        <div className={styles.buttonRow}>
          <button
            type="submit"
            disabled={loading}
            className={`${buttonStyles.primary} ${loading ? buttonStyles.loading : ''}`}
            onClick={handleSubmit}
          >
            {loading ? "Actualizando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
