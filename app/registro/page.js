"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import styles from './page.module.css';
import ModalTerminos from "../../components/ModalTerminos";
import ModalPrivacidad from "../../components/ModalPrivacidad";
import TurnstileWidget from "../../components/Turnstile";

export default function Register() {
  const [username, setUsername] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [fullEmail, setFullEmail] = useState("");
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [externalDomainsAllowed, setExternalDomainsAllowed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [existingUser, setExistingUser] = useState(false);
  const [showResendSection, setShowResendSection] = useState(false);
  const [resendTurnstileToken, setResendTurnstileToken] = useState("");
  const [showTerminos, setShowTerminos] = useState(false);
  const [showPrivacidad, setShowPrivacidad] = useState(false);
  const [acceptedTerminos, setAcceptedTerminos] = useState(false);
  const [acceptedPrivacidad, setAcceptedPrivacidad] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [registrationStatusLoading, setRegistrationStatusLoading] = useState(true);
  const [registrationDisabledMessage, setRegistrationDisabledMessage] = useState("");
  const router = useRouter();

  // Helper function for API calls with consistent error handling
  const makeApiCall = async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Error de servidor. Por favor, intenta nuevamente.');
      }
      
      if (!response.ok) {
        throw new Error(data.message || `Error en ${url}`);
      }
      
      return { response, data };
    } catch (error) {
      throw error;
    }
  };

  // Load allowed domains on component mount
  useEffect(() => {
    const loadAllowedDomains = async () => {
      try {
        const { data } = await makeApiCall('/api/allowed-domains');
        
        if (data.success && data.domains) {
          setAllowedDomains(data.domains);
          const externalAllowed = data.externalDomainsAllowed || false;
          setExternalDomainsAllowed(externalAllowed);
          
          if (!externalAllowed && data.domains.length > 0) {
            setSelectedDomain(data.domains[0].domain);
          } else if (externalAllowed) {
            setSelectedDomain(""); // Clear for external domains so user can type their own
          }
        } else {
          setError('Error al cargar los dominios permitidos');
        }
      } catch (error) {
        console.error('Error loading allowed domains:', error);
        setError('Error al cargar los dominios permitidos');
      } finally {
        setDomainsLoading(false);
      }
    };

    loadAllowedDomains();
  }, []);

  // Check registration status on component mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const { data } = await makeApiCall('/api/registration-status');
        
        setRegistrationEnabled(data.enabled);
        if (!data.enabled) {
          setRegistrationDisabledMessage(data.message);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
        setRegistrationEnabled(true);
      } finally {
        setRegistrationStatusLoading(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const handleTurnstileSuccess = (token) => {
    setTurnstileToken(token);
    setError("");
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
    
    if (!acceptedTerminos || !acceptedPrivacidad) {
      setError("Debes aceptar los Términos de Uso y la Política de Privacidad.");
      return;
    }
    
    if (!turnstileToken) {
      setError("Por favor, completa la verificación de seguridad.");
      return;
    }

    let email;
    
    if (externalDomainsAllowed) {
      // When external domains are allowed, use the full email input
      if (!fullEmail.trim()) {
        setError("Por favor, ingresa tu dirección de correo electrónico.");
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fullEmail.trim())) {
        setError("Por favor, ingresa un correo electrónico válido.");
        return;
      }
      
      email = fullEmail.trim();
    } else {
      // When restricted to institutional domains, use username + domain
      if (!username.trim()) {
        setError("Por favor, ingresa un nombre de usuario.");
        return;
      }

      if (!selectedDomain) {
        setError("Por favor, selecciona un dominio.");
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9._-]+$/;
      if (!usernameRegex.test(username)) {
        setError("El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.");
        return;
      }
      
      email = `${username.trim()}@${selectedDomain}`;
    }

    setLoading(true);
    setError("");
    setExistingUser(false);

    try {
      // Handle register API call directly to catch 400 responses
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, turnstileToken }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        setError('Error de servidor. Por favor, intenta nuevamente.');
        return;
      }

      if (response.status === 400 && data.message) {
        if (data.message.includes('ya está registrado y verificado')) {
          setError('Este correo ya está registrado. Inicia sesión.');
          setTurnstileToken(""); // Clear token for this error
          return;
        }
        if (data.message.includes('ya está registrado pero no verificado')) {
          setExistingUser(true);
          setShowResendSection(true);
          setError('');
          // Don't clear turnstile token here - we need it for resend
          return;
        }
        // Handle other 400 errors
        setError(data.message);
        setTurnstileToken(""); // Clear token for other errors
        return;
      }

      if (!response.ok) {
        setError(data.message || 'Error al procesar el registro');
        return;
      }

      setEmailSent(true);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Error de conexión. Por favor, intenta nuevamente.');
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!resendTurnstileToken) {
      setError("Por favor, completa la verificación de seguridad antes de reenviar el correo.");
      return;
    }
    
    const email = externalDomainsAllowed 
      ? fullEmail.trim() 
      : `${username.trim()}@${selectedDomain}`;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, turnstileToken: resendTurnstileToken }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        setError('Error de servidor. Por favor, intenta nuevamente.');
        return;
      }

      if (!response.ok) {
        setError(data.message || 'Error al reenviar el correo de verificación');
        setResendTurnstileToken("");
        return;
      }
      
      setEmailSent(true);
      setExistingUser(false);
      setShowResendSection(false);
    } catch (error) {
      console.error('Resend error:', error);
      setError('Error de conexión. Por favor, intenta nuevamente.');
      setResendTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  // Turnstile handlers for resend section
  const handleResendTurnstileSuccess = (token) => {
    setResendTurnstileToken(token);
    setError("");
  };

  const handleResendTurnstileError = () => {
    setResendTurnstileToken("");
    setError("Error en la verificación de seguridad. Por favor, recarga la página e intenta de nuevo.");
  };

  const handleResendTurnstileExpire = () => {
    setResendTurnstileToken("");
    setError("La verificación de seguridad ha expirado. Por favor, completa la verificación nuevamente.");
  };

  // Function to go back to registration form
  const handleBackToRegistration = () => {
    setShowResendSection(false);
    setExistingUser(false);
    setError("");
    setResendTurnstileToken("");
  };

  const currentEmail = externalDomainsAllowed 
    ? fullEmail 
    : (username && selectedDomain ? `${username}@${selectedDomain}` : "");

  // Render helper for consistent card structure
  const renderCard = (title, children, className = styles.card) => (
    <div className={styles.page}>
      <div className={className}>
        {title && <h1 className={styles.title}>{title}</h1>}
        {children}
      </div>
    </div>
  );

  if (emailSent) {
    return renderCard(null, (
      <>
        <div className={styles.iconCircle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#2563eb" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm.5 5a.5.5 0 0 0-1 0v4.5a.5.5 0 0 0 .5.5H12a.5.5 0 0 0 0-1H8.5V5z"/>
          </svg>
        </div>
        <h1 className={styles.titleEmailSent}>¡Revisa tu correo electrónico!</h1>
        <p className={styles.emailSentText}>
          Hemos enviado un correo a <strong>{currentEmail}</strong> con un enlace para completar tu registro.
        </p>
        <p className={styles.emailSentSubText}>
          El correo debería llegar en unos minutos. Si no lo encuentras, revisa también tu carpeta de spam.
        </p>
        <div className={styles.emailSentBack}>
          <Link href="/login" className={styles.emailSentBackLink}>
            Volver al inicio de sesión
          </Link>
        </div>
      </>
    ), styles.cardEmailSent);
  }

  if (registrationStatusLoading || domainsLoading) {
    return renderCard("Crear cuenta", (
      <p className={styles.subtitle}>
        {registrationStatusLoading ? "Verificando disponibilidad..." : "Cargando dominios permitidos..."}
      </p>
    ));
  }

  if (!registrationEnabled || allowedDomains.length === 0) {
    const message = !registrationEnabled 
      ? registrationDisabledMessage 
      : "No hay dominios de correo disponibles en este momento.";
    
    return renderCard("Registro no disponible", (
      <div className={styles.registrationDisabled}>
        <p className={styles.registrationDisabledText}>{message}</p>
        <p className={styles.registrationDisabledSubtext}>
          Por favor, {!registrationEnabled ? "intenta más tarde o " : ""}contacta con el soporte si necesitas ayuda.
        </p>
        <div className={styles.backToLogin}>
          <Link href="/login" className={styles.loginLink}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    ));
  }

  // Render resend verification section
  if (showResendSection) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.iconCircle}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#f59e0b" viewBox="0 0 16 16">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
          </div>
          <h1 className={styles.titleEmailSent}>Correo ya registrado</h1>
          <p className={styles.emailSentText}>
            El correo <strong>{externalDomainsAllowed ? fullEmail : `${username}@${selectedDomain}`}</strong> ya está registrado pero aún no ha sido verificado.
          </p>
          <p className={styles.emailSentSubText}>
            Puedes reenviar el correo de verificación para completar tu registro.
          </p>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
            <TurnstileWidget
              onSuccess={handleResendTurnstileSuccess}
              onError={handleResendTurnstileError}
              onExpire={handleResendTurnstileExpire}
            />
          </div>
          
          <button
            onClick={handleResendEmail}
            className={styles.submitButton}
            disabled={loading || !resendTurnstileToken}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Enviando...' : 'Reenviar correo de verificación'}
          </button>
          
          <button
            onClick={handleBackToRegistration}
            className={styles.backToRegButton}
          >
            ← Volver al registro
          </button>
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
        
        {externalDomainsAllowed && (
          <div className={styles.specialNotice}>
            <div className={styles.specialNoticeIcon}>⏰</div>
            <div className={styles.specialNoticeContent}>
              <p className={styles.specialNoticeTitle}>
                ¡Registro abierto por tiempo limitado!
              </p>
              <p className={styles.specialNoticeText}>
                Actualmente se permiten dominios de correo externos. Aprovecha esta oportunidad para registrarte.
              </p>
            </div>
          </div>
        )}
        
        <div className={styles.emailInfo}>
          <p className={styles.emailInfoText}>
            💡 Usa tu email {externalDomainsAllowed ? 'institucional o personal' : 'institucional'} para recibir la confirmación
          </p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {externalDomainsAllowed ? (
            // Single email input when external domains are allowed
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={fullEmail}
                onChange={e => setFullEmail(e.target.value)}
                className={styles.input}
                placeholder="tu.correo@ejemplo.com"
              />
            </div>
          ) : (
            // Username + domain builder when restricted to institutional domains
            <div className={styles.emailBuilder}>
              <div className={styles.inputGroup}>
                <label htmlFor="username" className={styles.label}>Tu usuario institucional</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={styles.input}
                  placeholder="tu.usuario.real"
                />
              </div>
              
              <div className={styles.atSymbol}>@</div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="domain" className={styles.label}>Dominio institucional</label>
                <select
                  id="domain"
                  name="domain"
                  required
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value)}
                  className={styles.select}
                >
                  {allowedDomains.map((domain) => (
                    <option key={domain.id} value={domain.domain}>
                      {domain.domain}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          


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

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <TurnstileWidget
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !turnstileToken || (externalDomainsAllowed ? !fullEmail.trim() : (!username.trim() || !selectedDomain))}
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
