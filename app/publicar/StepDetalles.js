import React from 'react';

export default function StepDetalles({ form, handleChange, setForm, styles, minPriceValue }) {
  return (
    <>
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder={form.type === 'servicio' ? "Nombre del servicio" : "Título del producto"}
        required
        className={styles.publicarInput}
        minLength={5}
        maxLength={40}
      />
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
        Título: mínimo 5 y máximo 40 caracteres ({form.title.length}/40)
      </div>
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder={form.type === 'servicio' ? "Describe el servicio que ofreces" : "Descripción del producto"}
        required
        rows={3}
        className={styles.publicarTextarea}
        minLength={20}
        maxLength={200}
      />
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
        Descripción: mínimo 20 y máximo 200 caracteres ({form.description.length}/200)
      </div>
      {(form.type === "producto" || form.type === "servicio") && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
            
            
          </div>
          {!form.priceRange || form.type === 'servicio' ? (
            <input
              name="priceMin"
              value={form.priceMin || ''}
              onChange={e => {
                const value = e.target.value.replace(/[^\d.]/g, '');
                setForm(f => ({ ...f, priceMin: value }));
              }}
              placeholder={form.type === 'servicio' ? "Precio base del servicio" : "Precio"}
              type="text"
              pattern="^\\d+(\\.\\d{1,2})?$"
              inputMode="decimal"
              required
              className={styles.publicarInput}
              autoComplete="off"
              maxLength={10}
              min={minPriceValue}
              title={`Ingresa solo números (mínimo $${minPriceValue})`}
              style={{ width: '100%' }}
            />
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
              <input
                name="priceMin"
                value={form.priceMin || ''}
                onChange={e => {
                  const value = e.target.value.replace(/[^\d.]/g, '');
                  setForm(f => ({ ...f, priceMin: value }));
                }}
                placeholder="Precio mínimo"
                type="text"
                pattern="^\\d+(\\.\\d{1,2})?$"
                inputMode="decimal"
                required
                className={styles.publicarInput}
                autoComplete="off"
                maxLength={10}
                min={minPriceValue}
                title={`Ingresa solo números (mínimo $${minPriceValue})`}
                style={{ flex: 1, minWidth: 0 }}
              />
              <span style={{ color: '#64748b', fontWeight: 600 }}>a</span>
              <input
                name="priceMax"
                value={form.priceMax || ''}
                onChange={e => {
                  const value = e.target.value.replace(/[^\d.]/g, '');
                  setForm(f => ({ ...f, priceMax: value }));
                }}
                placeholder="Precio máximo"
                type="text"
                pattern="^\\d+(\\.\\d{1,2})?$"
                inputMode="decimal"
                required
                className={styles.publicarInput}
                autoComplete="off"
                maxLength={10}
                min={minPriceValue}
                title={`Ingresa solo números (mínimo $${minPriceValue})`}
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>
          )}
          
        </div>
      )}
    </>
  );
}
