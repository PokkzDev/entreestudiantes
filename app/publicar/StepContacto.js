import React from 'react';

export default function StepContacto({ form, handleChange, setForm, styles }) {
  return (
    <>
      <select name="contactMethod" value={form.contactMethod} onChange={handleChange} className={styles.publicarSelect}>
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
        <option value="telefono">Teléfono</option>
        <option value="otro">Otro</option>
      </select>
      {(form.contactMethod === 'whatsapp' || form.contactMethod === 'telefono') ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <span
            style={{
              fontWeight: 600,
              color: '#fff',
              background: '#6366f1',
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
              padding: '0 12px',
              height: 40,
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #6366f1',
              borderRight: 'none',
              fontSize: 16,
              letterSpacing: 1,
            }}
          >
            +56
          </span>
          <input
            name="contactInfo"
            value={form.contactInfo}
            onChange={e => {
              let value = e.target.value.replace(/\D/g, '').slice(0, 9);
              setForm(f => ({ ...f, contactInfo: value }));
            }}
            placeholder="9 12345678"
            required
            className={styles.publicarInput}
            maxLength={9}
            minLength={9}
            pattern="^\d{9}$"
            title="Ingresa un número chileno válido de 9 dígitos"
            style={{
              flex: 1,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: 'none',
              height: 40,
            }}
          />
        </div>
      ) : form.contactMethod === 'email' ? (
        <input
          name="contactInfo"
          value={form.contactInfo}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
          required
          className={styles.publicarInput}
          type="email"
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
          title="Ingresa un correo electrónico válido"
        />
      ) : (
        <input
          name="contactInfo"
          value={form.contactInfo}
          onChange={handleChange}
          placeholder="Tu contacto"
          required
          className={styles.publicarInput}
        />
      )}
    </>
  );
}
