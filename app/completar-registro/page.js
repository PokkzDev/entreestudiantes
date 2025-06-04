"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import styles from './page.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { chileanUniversities } from '../../utils/unicampus';

export default function CompletarRegistroWrapper() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CompletarRegistro />
    </Suspense>
  );
}

function CompletarRegistro() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [campus, setCampus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checking, setChecking] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    // Redirect if no token or email
    if (!token || !email) {
      router.push('/registro');
      return;
    }
    // Check if user is already verified
    const checkVerified = async () => {
      try {
        const res = await fetch(`/api/check-verified?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isVerified) {
            router.replace('/login');
          }
        }
      } catch {}
      setChecking(false);
    };
    checkVerified();
  }, [token, email, router]);

  useEffect(() => {
    setPasswordValidations({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Frontend validation
    if (!username || username.length < 4) {
      setError("El nombre de usuario debe tener al menos 4 caracteres.");
      return;
    }
    if (!name || name.trim().length === 0) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    if (!university) {
      setError("Debes seleccionar una universidad.");
      return;
    }
    if (!campus) {
      setError("Debes seleccionar un campus.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!(
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    )) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, username, name, password, university, campus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al completar el registro");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className={styles.page}>Cargando...</div>;

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#22c55e" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
          </div>
          <h1 className={styles.successTitle}>¡Registro completado!</h1>
          <p className={styles.successText}>
            Tu cuenta ha sido creada exitosamente. Serás redirigido al inicio de sesión.
          </p>
          <div className={styles.successLinkContainer}>
            <Link href="/login" className={styles.successLink}>
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Completa tu registro</h1>
        <p className={styles.subtitle}>
          Elige tu nombre de usuario y una contraseña para finalizar la creación de tu cuenta
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email || ''}
              disabled
              className={styles.inputDisabled}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>Nombre de usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Nombre completo</label>
            <input
              id="name"
              name="name"
              type="text"
              className={styles.input}
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="university" className={styles.label}>Universidad</label>
                <select
                  id="university"
                  name="university"
                  required
                  value={university}
                  onChange={(e) => {
                    setUniversity(e.target.value);
                    setCampus(""); // Reset campus when university changes
                  }}
                  className={styles.input}
                >
                  <option value="">Selecciona tu universidad</option>
                  {chileanUniversities.map((uni) => (
                    <option key={uni.name} value={uni.name}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="campus" className={styles.label}>Campus</label>
                <select
                  id="campus"
                  name="campus"
                  required
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  disabled={!university}
                  className={university ? styles.input : styles.inputDisabled}
                >
                  <option value="">
                    {university ? 'Selecciona tu campus' : 'Primero selecciona una universidad'}
                  </option>
                  {university && 
                    chileanUniversities
                      .find(uni => uni.name === university)
                      ?.campuses.map((campusName) => (
                        <option key={campusName} value={campusName}>
                          {campusName}
                        </option>
                      ))
                  }
                </select>
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Contraseña</label>
            <div className={styles.passwordContainer}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                className={styles.passwordInput}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword(v => !v)}
                className={styles.toggleButton}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
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
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirmar contraseña</label>
            <div className={styles.passwordContainer}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.passwordInput}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowConfirmPassword(v => !v)}
                className={styles.toggleButton}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Procesando...' : 'Completar registro'}
          </button>
        </form>
      </div>
    </div>
  );
}
