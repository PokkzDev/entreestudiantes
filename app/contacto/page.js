"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { FaEnvelope, FaUser, FaQuestionCircle, FaBug, FaHandshake, FaCheckCircle } from 'react-icons/fa';
import styles from './page.module.css';
import TurnstileWidget from '../../components/Turnstile';

export default function Contacto() {
  const { data: session } = useSession();
  const [type, setType] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  // Pre-fill email and name if user is logged in
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.name) {
      setName(session.user.name);
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

    if (!session && (!email.trim() || !name.trim())) {
      setError("Por favor, completa tu nombre y correo electrónico.");
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          message: message.trim(),
          email: email.trim() || null,
          name: name.trim() || null,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar el mensaje");
      }

      setSuccess(true);
      // Reset form
      setType("general");
      setSubject("");
      setMessage("");
      if (!session?.user?.email) {
        setEmail("");
        setName("");
      }
      setTurnstileToken("");

    } catch (error) {
      setError(error.message);
      setTurnstileToken(""); // Reset Turnstile on error
    } finally {
      setLoading(false);
    }
  };

  const contactTypes = [
    {
      value: "general",
      label: "Consulta General",
      icon: <FaQuestionCircle />,
      description: "Preguntas generales sobre la plataforma"
    },
    {
      value: "support",
      label: "Soporte Técnico",
      icon: <FaBug />,
      description: "Problemas técnicos o errores"
    },
    {
      value: "business",
      label: "Consulta Comercial",
      icon: <FaHandshake />,
      description: "Partnerships, colaboraciones o negocios"
    },
    {
      value: "account",
      label: "Problema de Cuenta",
      icon: <FaUser />,
      description: "Problemas con tu cuenta o acceso"
    }
  ];

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.iconCircle}>
            <FaCheckCircle className={styles.successIcon} />
          </div>
          <h1 className={styles.successTitle}>¡Mensaje Enviado!</h1>
          <p className={styles.successText}>
            Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos lo antes posible.
            Normalmente respondemos dentro de 24-48 horas.
          </p>
          <div className={styles.successActions}>
            <button
              onClick={() => setSuccess(false)}
              className={styles.sendAnotherButton}
            >
              Enviar otro mensaje
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
          <FaEnvelope className={styles.mainIcon} />
          <h1 className={styles.title}>Contáctanos</h1>
          <p className={styles.subtitle}>
            ¿Tienes preguntas, sugerencias o necesitas ayuda? Estamos aquí para ayudarte.
            Completa el formulario y nos pondremos en contacto contigo pronto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.typeSelection}>
            <label className={styles.label}>Tipo de consulta *</label>
            <div className={styles.typeGrid}>
              {contactTypes.map((contactType) => (
                <div
                  key={contactType.value}
                  className={`${styles.typeOption} ${type === contactType.value ? styles.typeOptionSelected : ''}`}
                  onClick={() => setType(contactType.value)}
                >
                  <div className={styles.typeIcon}>
                    {contactType.icon}
                  </div>
                  <div className={styles.typeContent}>
                    <h3 className={styles.typeLabel}>{contactType.label}</h3>
                    <p className={styles.typeDescription}>{contactType.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!session && (
            <div className={styles.contactInfo}>
              <div className={styles.inputGroup}>
                <label htmlFor="name" className={styles.label}>
                  Nombre completo *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  placeholder="Tu nombre completo"
                  maxLength={100}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Correo electrónico *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>
          )}

          {session && (
            <div className={styles.loggedInInfo}>
              <div className={styles.userInfo}>
                <FaUser className={styles.userIcon} />
                <div>
                  <p className={styles.userName}>{session.user.name || 'Usuario'}</p>
                  <p className={styles.userEmail}>{session.user.email}</p>
                </div>
              </div>
            </div>
          )}

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
              placeholder="¿En qué podemos ayudarte?"
              maxLength={100}
              required
            />
            <span className={styles.charCount}>{subject.length}/100</span>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="message" className={styles.label}>
              Mensaje *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={styles.textarea}
              placeholder="Describe detalladamente tu consulta, problema o pregunta..."
              rows={6}
              maxLength={1000}
              required
            />
            <span className={styles.charCount}>{message.length}/1000</span>
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
            {loading ? "Enviando..." : "Enviar Mensaje"}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            También puedes enviarnos sugerencias específicas en <Link href="/sugerencias" className={styles.link}>nuestra página de feedback</Link>.
          </p>
        </div>
      </div>
    </div>
  );
} 