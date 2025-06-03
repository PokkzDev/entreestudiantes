"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './page.module.css';
import TurnstileWidget from '../../components/Turnstile';

function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for message parameter in URL
  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
      // Clear the message after 10 seconds
      const timer = setTimeout(() => setMessage(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleTurnstileSuccess = (token) => {
    setTurnstileToken(token);
    setError(""); // Clear any existing errors when Turnstile is verified
  };

  const handleTurnstileError = () => {
    setTurnstileToken("");
    setError("Error en la verificación de seguridad. Por favor, recarga la página e intenta de nuevo.");
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken("");
    setError("La verificación de seguridad ha expirado. Por favor, completa la verificación nuevamente.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setError("Por favor, completa la verificación de seguridad.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage(""); // Clear any existing messages
    
    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
      remember, // send remember value
      turnstileToken, // send turnstile token
    });
    
    setLoading(false);
    if (res?.error) {
      // Show specific error message from authentication, or generic message for credential errors
      if (res.error === "CredentialsSignin") {
        setError("Correo, usuario o contraseña incorrectos");
      } else {
        setError(res.error);
      }
      // Reset Turnstile on error
      setTurnstileToken("");
    } else {
      router.push("/");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        
        {/* Display message from URL parameter (e.g., account suspension) */}
        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier" className={styles.label}>Correo electrónico o nombre de usuario</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Contraseña</label>
            <div className={styles.passwordInputGroup}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={styles.passwordInput}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword(v => !v)}
                className={styles.passwordToggle}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className={styles.checkboxGroup}>
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className={styles.checkbox}
            />
            <label htmlFor="remember" className={styles.checkboxLabel}>
              Mantener sesión iniciada
            </label>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.turnstileWrapper}>
            <TurnstileWidget
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className={styles.submitButton}
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
        <div className={styles.links}>
          <Link href="/recuperar-contrasena" className={styles.forgotPasswordLink}>
            ¿Olvidaste tu contraseña?
          </Link>
          <p className={styles.linkText}>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className={styles.link}>
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
