"use client";
import { useState } from "react";
import Link from 'next/link';
import styles from './page.module.css';

export default function RecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const res = await fetch("/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar el correo");
      }
    } catch (err) {
      setError("Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.");
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {success ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>
              ✓
            </div>
            <div className={styles.header}>
              <h1 className={styles.title}>¡Correo enviado!</h1>
            </div>
            <div className={styles.successMessage}>
              Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.
            </div>
            <div className={styles.successSubtext}>
              Revisa tu bandeja de entrada y también la carpeta de spam. El enlace será válido por 1 hora.
            </div>
            <div className={styles.backToLogin}>
              <Link href="/login" className={styles.backToLoginLink}>
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Recuperar contraseña</h1>
              <p className={styles.subtitle}>
                Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
              
              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
            
            <div className={styles.backToLogin}>
              <Link href="/login" className={styles.backToLoginLink}>
                ← Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
