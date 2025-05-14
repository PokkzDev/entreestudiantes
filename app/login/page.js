"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import styles from '../page.module.css';

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
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
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
      </div>
    </div>
  );
}
