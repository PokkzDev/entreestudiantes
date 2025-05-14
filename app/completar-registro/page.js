"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import styles from '../page.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function CompletarRegistro() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    // Redirect if no token or email
    if (!token || !email) {
      router.push('/registro');
    }
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
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, username, name, password }),
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

  if (success) {
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
            background: '#e6ffea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#22c55e" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: '#22c55e',
            letterSpacing: '-0.02em',
          }}>¡Registro completado!</h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: '1.6' }}>
            Tu cuenta ha sido creada exitosamente. Serás redirigido al inicio de sesión.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/login" style={{ 
              color: '#6366f1', 
              fontWeight: 600, 
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '1rem' 
            }}>
              Ir al inicio de sesión
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
        maxWidth: '500px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#2563eb',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}>Completa tu registro</h1>
        <p style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center', margin: '-1rem 0 0' }}>
          Elige tu nombre de usuario y una contraseña para finalizar la creación de tu cuenta
        </p>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="email" style={{ fontWeight: 600, color: '#334155' }}>Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email || ''}
              disabled
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #e0e7ef',
                fontSize: '1.08rem',
                outline: 'none',
                background: '#f1f5f9',
                color: '#64748b',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="username" style={{ fontWeight: 600, color: '#334155' }}>Nombre de usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="name" style={{ fontWeight: 600, color: '#334155' }}>Nombre completo</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="password" style={{ fontWeight: 600, color: '#334155' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  padding: '0.85rem 2.5rem 0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #e0e7ef',
                  fontSize: '1.08rem',
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#334155',
                  transition: 'border 0.2s',
                  width: '100%'
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: '0.7rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  margin: 0,
                  color: '#64748b',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0 0', fontSize: '0.98rem', lineHeight: 1.5 }}>
              <li style={{ color: passwordValidations.length ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {passwordValidations.length ? '✔' : '✖'} Al menos 8 caracteres
              </li>
              <li style={{ color: passwordValidations.uppercase ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {passwordValidations.uppercase ? '✔' : '✖'} Una letra mayúscula
              </li>
              <li style={{ color: passwordValidations.lowercase ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {passwordValidations.lowercase ? '✔' : '✖'} Una letra minúscula
              </li>
              <li style={{ color: passwordValidations.number ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {passwordValidations.number ? '✔' : '✖'} Un número
              </li>
              <li style={{ color: passwordValidations.symbol ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {passwordValidations.symbol ? '✔' : '✖'} Un símbolo
              </li>
            </ul>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="confirmPassword" style={{ fontWeight: 600, color: '#334155' }}>Confirmar contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  padding: '0.85rem 2.5rem 0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #e0e7ef',
                  fontSize: '1.08rem',
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#334155',
                  transition: 'border 0.2s',
                  width: '100%'
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowConfirmPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: '0.7rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  margin: 0,
                  color: '#64748b',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {error && <div style={{ color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
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
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Procesando...' : 'Completar registro'}
          </button>
        </form>
      </div>
    </div>
  );
}
