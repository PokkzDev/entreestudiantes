"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import styles from './page.module.css';

export default function Register() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [existingUser, setExistingUser] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          setError('Este correo ya está registrado y verificado. Inicia sesión.');
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
      <div className={styles.page} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.07)',
          padding: '2.5rem 2rem',
          maxWidth: '500px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#e6f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#2563eb" viewBox="0 0 16 16">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm.5 5a.5.5 0 0 0-1 0v4.5a.5.5 0 0 0 .5.5H12a.5.5 0 0 0 0-1H8.5V5z"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: '#2563eb',
            letterSpacing: '-0.02em',
          }}>¡Revisa tu correo electrónico!</h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: '1.6' }}>
            Hemos enviado un correo a <strong>{email}</strong> con un enlace para completar tu registro.
          </p>
          <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: '1.5' }}>
            El correo debería llegar en unos minutos. Si no lo encuentras, revisa también tu carpeta de spam.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/login" style={{ 
              color: '#6366f1', 
              fontWeight: 600, 
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '1rem' 
            }}>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 8px 32px 0 rgba(31,38,135,0.07)',
        padding: '2.5rem 2rem',
        maxWidth: '400px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#2563eb',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}>Crear cuenta</h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', textAlign: 'center', margin: '-1rem 0 0' }}>
          Ingresa tu correo electrónico para comenzar
        </p>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="email" style={{ fontWeight: 600, color: '#334155' }}>Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #e0e7ef',
                fontSize: '1.08rem',
                outline: 'none',
                background: '#f8fafc',
                color: '#334155',
                transition: 'border 0.2s',
              }}
            />
          </div>
          {error && <div style={{ color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
          
          {existingUser && (
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <p style={{ color: '#0284c7', marginBottom: '0.5rem' }}>¿No recibiste el correo de confirmación?</p>
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
                style={{
                  background: '#0ea5e9',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.7rem 1.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s',
                }}
              >
                Reenviar correo de verificación
              </button>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(90deg, #334155 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.13rem',
              border: 'none',
              borderRadius: '10px',
              padding: '0.85rem 2.2rem',
              boxShadow: '0 8px 24px -8px #33415533',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s',
            }}
          >
            {loading ? 'Procesando...' : 'Continuar'}
          </button>
        </form>
        <div style={{ fontSize: '1rem', color: '#64748b', textAlign: 'center' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
