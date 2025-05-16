"use client";
import { useState } from "react";

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
      setError("Error de red");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
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
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Recuperar contraseña
        </h1>
        <div style={{ color: '#64748b', fontWeight: 500, textAlign: 'center', fontSize: '1rem', marginBottom: '-1rem' }}>
          {/* Mensaje solo antes de enviar */}
          {/* Eliminado el mensaje duplicado */}
        </div>
        {success ? (
          <div style={{ color: '#22c55e', fontWeight: 600, textAlign: 'center' }}>
            Si tu email está registrado, se ha enviado un enlace para restablecer la contraseña.
          </div>
        ) : (
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
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
