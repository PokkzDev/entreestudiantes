"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import styles from './page.module.css';
import ModalTerminos from "../../components/ModalTerminos";
import ModalPrivacidad from "../../components/ModalPrivacidad";

export default function Register() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [existingUser, setExistingUser] = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);
  const [showPrivacidad, setShowPrivacidad] = useState(false);
  const [acceptedTerminos, setAcceptedTerminos] = useState(false);
  const [acceptedPrivacidad, setAcceptedPrivacidad] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerminos || !acceptedPrivacidad) {
      setError("Debes aceptar los Términos de Uso y la Política de Privacidad.");
      return;
    }
    setLoading(true);
    setError("");
    setExistingUser(false);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 400 && responseData.message.includes('ya está registrado y verificado')) {
          setError('Este correo ya está registrado. Inicia sesión.');
          return;
        }
        if (response.status === 400 && responseData.message.includes('ya está registrado pero no verificado')) {
          setExistingUser(true);
          setError('Este correo ya está registrado pero no fue verificado. Puedes reenviar el correo.');
          return;
        }
        throw new Error(responseData.message || "Error al registrarse");
      }

      // Email sent successfully
      setEmailSent(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className={styles.page}>
        <div className={styles.cardEmailSent}>
          <div className={styles.iconCircle}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#2563eb" viewBox="0 0 16 16">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm.5 5a.5.5 0 0 0-1 0v4.5a.5.5 0 0 0 .5.5H12a.5.5 0 0 0 0-1H8.5V5z"/>
            </svg>
          </div>
          <h1 className={styles.titleEmailSent}>¡Revisa tu correo electrónico!</h1>
          <p className={styles.emailSentText}>
            Hemos enviado un correo a <strong>{email}</strong> con un enlace para completar tu registro.
          </p>
          <p className={styles.emailSentSubText}>
            El correo debería llegar en unos minutos. Si no lo encuentras, revisa también tu carpeta de spam.
          </p>
          <div className={styles.emailSentBack}>
            <Link href="/login" className={styles.emailSentBackLink}>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ModalTerminos open={showTerminos} onClose={() => setShowTerminos(false)} />
      <ModalPrivacidad open={showPrivacidad} onClose={() => setShowPrivacidad(false)} />
      <div className={styles.card}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>
          Ingresa tu correo electrónico para comenzar
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {existingUser && (
            <div className={styles.existingUser}>
              <p className={styles.existingUserText}>¿No recibiste el correo de confirmación?</p>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await fetch("/api/resend-verification", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ email }),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.message || "Error al reenviar el correo");
                    }
                    setEmailSent(true);
                    setExistingUser(false);
                  } catch (error) {
                    setError(error.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className={styles.resendButton}
                disabled={loading}
              >
                Reenviar correo de verificación
              </button>
            </div>
          )}
          {/* Separate checkboxes for legal acceptance */}
          <div className={styles.legalCheckboxGroup}>
            <div className={styles.legalCheckboxTitle}>
              Para continuar, debes aceptar:
            </div>
            <div className={styles.legalCheckboxItem}>
              <input
                type="checkbox"
                id="terminosCheckbox"
                checked={acceptedTerminos}
                onChange={e => setAcceptedTerminos(e.target.checked)}
                className={styles.legalCheckbox}
              />
              <label htmlFor="terminosCheckbox" className={styles.legalCheckboxLabel}>
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowTerminos(true)}
                  className={styles.legalLink}
                  tabIndex={-1}
                >
                  Términos de Uso
                </button>
                .
              </label>
            </div>
            <div className={styles.legalCheckboxItem}>
              <input
                type="checkbox"
                id="privacidadCheckbox"
                checked={acceptedPrivacidad}
                onChange={e => setAcceptedPrivacidad(e.target.checked)}
                className={styles.legalCheckbox}
              />
              <label htmlFor="privacidadCheckbox" className={styles.legalCheckboxLabel}>
                Acepto la{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacidad(true)}
                  className={styles.legalLink}
                  tabIndex={-1}
                >
                  Política de Privacidad
                </button>
                .
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Procesando...' : 'Continuar'}
          </button>
        </form>
        <div className={styles.loginText}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className={styles.loginLink}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
