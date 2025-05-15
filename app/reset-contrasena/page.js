"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetContrasena() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setError(data.error || "Error al restablecer la contraseña");
      }
    } catch {
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
          Restablecer contraseña
        </h1>
        {success ? (
          <div style={{ color: '#22c55e', fontWeight: 600, textAlign: 'center' }}>
            Contraseña restablecida correctamente. Redirigiendo al login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="password" style={{ fontWeight: 600, color: '#334155' }}>Nueva contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="confirmPassword" style={{ fontWeight: 600, color: '#334155' }}>Confirmar contraseña</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
