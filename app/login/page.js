"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from '../page.module.css';

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
      remember, // send remember value
    });
    setLoading(false);
    if (res?.error) {
      setError("Correo, usuario o contraseña incorrectos");
    } else {
      router.push("/");
    }
  };

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
        }}>Iniciar sesión</h1>
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="identifier" style={{ fontWeight: 600, color: '#334155' }}>Correo electrónico o nombre de usuario</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
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
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '-0.5rem', marginBottom: '-0.5rem' }}>
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ accentColor: '#6366f1', width: 18, height: 18 }}
            />
            <label htmlFor="remember" style={{ color: '#64748b', fontSize: '1rem', cursor: 'pointer', userSelect: 'none' }}>
              Recuérdame
            </label>
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
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div style={{ fontSize: '1rem', color: '#64748b', textAlign: 'center' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/registro" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Regístrate</Link>
        </div>
        <div style={{ fontSize: '1rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' }}>
          <Link href="/recuperar-contrasena" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>¿Olvidaste tu contraseña?</Link>
        </div>
      </div>
    </div>
  );
}
