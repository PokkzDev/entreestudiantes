"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { FaLightbulb, FaBug, FaPlus, FaComments, FaCheckCircle } from 'react-icons/fa';
import styles from './page.module.css';
import TurnstileWidget from '../../components/Turnstile';

export default function Sugerencias() {
  const { data: session } = useSession();
  const [type, setType] = useState("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);

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

    if (!type || !subject.trim() || !message.trim()) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          message: message.trim(),
          email: email.trim() || null,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar la sugerencia");
      }

      setSuccess(true);
      // Reset form
      setType("feedback");
      setSubject("");
      setMessage("");
      if (!session?.user?.email) {
        setEmail("");
      }
      setTurnstileToken("");

    } catch (error) {
      setError(error.message);
      setTurnstileToken(""); // Reset Turnstile on error
    } finally {
      setLoading(false);
    }
  };

  const feedbackTypes = [
    {
      value: "feedback",
      label: "Comentario General",
      icon: <FaComments />,
      description: "Comparte tu opinión o experiencia"
    },
    {
      value: "bug",
      label: "Reportar Bug",
      icon: <FaBug />,
      description: "Reporta un problema o error"
    },
    {
      value: "feature",
      label: "Nueva Funcionalidad",
      icon: <FaPlus />,
      description: "Sugiere una nueva característica"
    },
    {
      value: "other",
      label: "Otro",
      icon: <FaLightbulb />,
      description: "Cualquier otra sugerencia"
    }
  ];

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.iconCircle}>
            <FaCheckCircle className={styles.successIcon} />
          </div>
          <h1 className={styles.successTitle}>¡Sugerencia Enviada!</h1>
          <p className={styles.successText}>
            Gracias por tu feedback. Hemos recibido tu sugerencia y la revisaremos pronto.
            Tu opinión nos ayuda a mejorar la plataforma.
          </p>
          <div className={styles.successActions}>
            <button
              onClick={() => setSuccess(false)}
              className={styles.sendAnotherButton}
            >
              Enviar otra sugerencia
            </button>
            <Link href="/" className={styles.backHomeLink}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <FaLightbulb className={styles.mainIcon} />
          <h1 className={styles.title}>Sugerencias y Comentarios</h1>
          <p className={styles.subtitle}>
            Tu opinión es importante para nosotros. Comparte tus ideas, reporta problemas o sugiere mejoras.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.typeSelection}>
            <label className={styles.label}>Tipo de sugerencia *</label>
            <div className={styles.typeGrid}>
              {feedbackTypes.map((feedbackType) => (
                <div
                  key={feedbackType.value}
                  className={`${styles.typeOption} ${type === feedbackType.value ? styles.typeOptionSelected : ''}`}
                  onClick={() => setType(feedbackType.value)}
                >
                  <div className={styles.typeIcon}>
                    {feedbackType.icon}
                  </div>
                  <div className={styles.typeContent}>
                    <h3 className={styles.typeLabel}>{feedbackType.label}</h3>
                    <p className={styles.typeDescription}>{feedbackType.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="subject" className={styles.label}>
              Asunto *
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={styles.input}
              placeholder="Resumen breve de tu sugerencia"
              maxLength={100}
              required
            />
            <span className={styles.charCount}>{subject.length}/100</span>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="message" className={styles.label}>
              Descripción *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={styles.textarea}
              placeholder="Describe detalladamente tu sugerencia, problema o idea..."
              rows={6}
              maxLength={1000}
              required
            />
            <span className={styles.charCount}>{message.length}/1000</span>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Correo electrónico {!session && "*"}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="tu@email.com"
              disabled={!!session?.user?.email}
              required={!session}
            />
            {session?.user?.email && (
              <span className={styles.fieldNote}>Usando tu correo de la cuenta</span>
            )}
            {!session && (
              <span className={styles.fieldNote}>Para enviarte actualizaciones sobre tu sugerencia</span>
            )}
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
            {loading ? "Enviando..." : "Enviar Sugerencia"}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            ¿Tienes una cuenta? <Link href="/login" className={styles.link}>Inicia sesión</Link> para un seguimiento mejor de tus sugerencias.
          </p>
        </div>
      </div>
    </div>
  );
} 