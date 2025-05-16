"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ResetContrasena() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update password validations on password change
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
    setError("");
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!(
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    )) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.");
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
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
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
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
