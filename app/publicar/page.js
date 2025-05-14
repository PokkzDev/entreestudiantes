"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";

const categoryOptions = [
  { value: '', label: 'Selecciona una categoría' },
  // Productos
  { value: 'libros', label: 'Libros, Apuntes y Material de Estudio' },
  { value: 'tecnologia', label: 'Tecnología (laptops, calculadoras, accesorios)' },
  { value: 'ropa', label: 'Ropa universitaria y Artículos personales' },
  { value: 'arte', label: 'Arte, Música y Manualidades' },
  { value: 'deportes', label: 'Artículos deportivos y recreativos' },
  { value: 'alimentos', label: 'Alimentos y Snacks caseros' },
  { value: 'otros', label: 'Otros productos para estudiantes' },
  // Servicios
  { value: 'servicios-tutorias', label: 'Tutorías (matemáticas, física, idiomas, etc.)' },
  { value: 'servicios-tecnicos', label: 'Servicio Técnico de Computadoras y Electrónicos' },
  { value: 'servicios-diseno', label: 'Diseño Gráfico y Multimedia' },
  { value: 'servicios-traduccion', label: 'Traducción y Redacción' },
  { value: 'servicios-impresion', label: 'Impresión y Copias' },
  { value: 'servicios-otros', label: 'Otros Servicios para Estudiantes' },
];

const steps = [
  "Tipo",
  "Categoría",
  "Detalles",
  "Contacto",
  "Confirmar"
];

export default function PublicarPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    type: "producto",
    title: "",
    description: "",
    price: "",
    priceMin: "",
    priceMax: "",
    priceRange: false,
    category: "",
    images: [],
    contactMethod: "whatsapp",
    contactInfo: "",
  });
  const router = useRouter();
  const { data: session, status } = useSession();

  // Función para formatear números con puntos para separar miles y comas para decimales
  const formatNumber = (num) => {
    if (!num) return '0';
    
    // Separar la parte entera y decimal
    let [integerPart, decimalPart] = num.toString().split('.');
    
    // Formatear la parte entera con puntos como separadores de miles
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Devolver el número formateado con coma para decimales si existe parte decimal
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
  };

  function handleNext() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => {
      if (name === 'category') {
        return {
          ...f,
          category: value,
        };
      }
      return { ...f, [name]: value };
    });
  }
  function handleTypeSelect(type) {
    setForm(f => ({ ...f, type }));
    handleNext();
  }
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Check if user is authenticated
    if (status !== "authenticated" || !session?.user?.id) {
      alert("Debes iniciar sesión para publicar");
      router.push("/login");
      return;
    }
    
    const formData = {
      ...form,
      authorId: session.user.id
    };
    
    const res = await fetch("/api/publicar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      router.push("/mis-publicaciones");
    } else {
      alert("Error al guardar la publicación: " + (data.error || "Intenta de nuevo"));
    }
  }

  function isStepValid() {
    if (step === 0) {
      return true;
    }
    if (step === 1) {
      return !!form.category;
    }
    if (step === 2) {
      if (form.type === 'producto') {
        if (form.priceRange) {
          const min = form.priceMin && /^\d+(\.\d{1,2})?$/.test(form.priceMin);
          const max = form.priceMax && /^\d+(\.\d{1,2})?$/.test(form.priceMax);
          const priceValid = min && max && parseFloat(form.priceMin) <= parseFloat(form.priceMax);
          return (
            form.title.trim() &&
            form.description.trim() &&
            priceValid
          );
        } else {
          return (
            form.title.trim() &&
            form.description.trim() &&
            form.priceMin && /^\d+(\.\d{1,2})?$/.test(form.priceMin)
          );
        }
      } else {
        return (
          form.title.trim() &&
          form.description.trim()
        );
      }
    }
    if (step === 3) {
      return form.contactMethod && form.contactInfo.trim();
    }
    return true;
  }

  return (
    <div className={styles.publicarPageWrapper}>
      <div className={styles.publicarProgressBarWrapper}>
        <div className={styles.progressBarColumn}>
          <div className={styles.progressBarRow}>
            {steps.map((label, idx) => (
              <div key={label} className={styles.progressStepWrapper}>
                <div
                  className={
                    idx === step
                      ? styles.progressStepActive
                      : styles.progressStep
                  }
                >
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <span
                    className={
                      idx < step
                        ? styles.progressBarConnectorActive
                        : styles.progressBarConnector
                    }
                  />
                )}
                <span
                  className={
                    idx === step
                      ? styles.progressStepLabelActive
                      : styles.progressStepLabel
                  }
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.publicarContainer}>
        <h2 className={styles.publicarTitle}>Registrar nuevo {form.type === 'servicio' ? 'servicio' : 'producto'}</h2>
        <div className={styles.publicarStep}>
          <strong>Paso {step + 1}:</strong> {steps[step]}
        </div>
        <form className={styles.publicarForm} onSubmit={handleSubmit} autoComplete="off">
          {step === 0 && (
            <div className={styles.typeSelectRow}>
              <button
                type="button"
                className={`${styles.publicarButton} ${styles.typeButton} ${form.type === 'producto' ? styles.selectedType : ''}`}
                onClick={() => handleTypeSelect('producto')}
              >
                <span className={styles.typeIcon}>📦</span>
                Producto
              </button>
              <button
                type="button"
                className={`${styles.publicarButton} ${styles.typeButton} ${form.type === 'servicio' ? styles.selectedType : ''}`}
                onClick={() => handleTypeSelect('servicio')}
              >
                <span className={styles.typeIcon}>🛠️</span>
                Servicio
              </button>
            </div>
          )}
          {step === 1 && (
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className={styles.publicarSelect}
            >
              <option value="">Selecciona una categoría</option>
              {categoryOptions
                .filter(opt => {
                  if (form.type === 'producto') {
                    // Solo mostrar categorías de productos
                    return !opt.value.startsWith('servicios-');
                  } else {
                    // Solo mostrar categorías de servicios
                    return opt.value.startsWith('servicios-');
                  }
                })
                .map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
          )}
          {step === 2 && (
            <>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={form.type === 'servicio' ? "Nombre del servicio" : "Título del producto"}
                required
                className={styles.publicarInput}
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={form.type === 'servicio' ? "Describe el servicio que ofreces" : "Descripción del producto"}
                required
                rows={3}
                className={styles.publicarTextarea}
              />
              {form.type === "producto" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="priceType"
                        checked={!form.priceRange}
                        onChange={() => setForm(f => ({ ...f, priceRange: false, priceMax: '', priceMin: '' }))}
                        style={{ accentColor: '#6366f1', marginRight: 2 }}
                      />
                      Precio fijo
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="priceType"
                        checked={!!form.priceRange}
                        onChange={() => setForm(f => ({ ...f, priceRange: true, priceMax: '', priceMin: '' }))}
                        style={{ accentColor: '#6366f1', marginRight: 2 }}
                      />
                      Rango de precios
                    </label>
                  </div>
                  {!form.priceRange ? (
                    <input
                      name="priceMin"
                      value={form.priceMin || ''}
                      onChange={e => {
                        const value = e.target.value.replace(/[^\d.]/g, '');
                        setForm(f => ({ ...f, priceMin: value }));
                      }}
                      placeholder="Precio"
                      type="text"
                      pattern="^\\d+(\\.\\d{1,2})?$"
                      inputMode="decimal"
                      required
                      className={styles.publicarInput}
                      autoComplete="off"
                      maxLength={10}
                      title="Ingresa solo números (puedes usar decimales)"
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
                        title="Ingresa solo números (puedes usar decimales)"
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
                        title="Ingresa solo números (puedes usar decimales)"
                        style={{ flex: 1, minWidth: 0 }}
                      />
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Puedes definir un rango de precios si tu producto lo requiere.
                  </span>
                </div>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <select name="contactMethod" value={form.contactMethod} onChange={handleChange} className={styles.publicarSelect}>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="telefono">Teléfono</option>
                <option value="otro">Otro</option>
              </select>
              <input name="contactInfo" value={form.contactInfo} onChange={handleChange} placeholder="Tu contacto" required className={styles.publicarInput} />
            </>
          )}
          {step === 4 && (
            <div className={styles.publicacionReview}>
              <h3 className={styles.reviewTitle}>Así se verá tu publicación</h3>
              <div className={styles.publicacionCard}>
                <div className={styles.publicacionCardHeader}>
                  <div className={styles.publicacionCategoryBadge}>
                    {categoryOptions.find(opt => opt.value === form.category)?.label || ''}
                  </div>
                  <div className={styles.publicacionType}>
                    {form.type === 'servicio' ? '🛠️ Servicio' : '📦 Producto'}
                  </div>
                </div>
                <h2 className={styles.publicacionTitle}>{form.title}</h2>
                <p className={styles.publicacionDescription}>{form.description}</p>
                <div className={styles.publicacionDetails}>
                  {form.type === "producto" && (
                    <div className={styles.publicacionPrice}>
                      <span className={styles.priceLabel}>Precio:</span>
                      <span className={styles.priceValue}>
                        {form.priceRange 
                          ? `$${formatNumber(form.priceMin)} a $${formatNumber(form.priceMax)}`
                          : `$${formatNumber(form.priceMin)}`
                        }
                      </span>
                    </div>
                  )}
                  <div className={styles.publicacionContact}>
                    <span className={styles.contactLabel}>Contacto:</span>
                    <span className={styles.contactValue}>
                      {form.contactMethod === 'whatsapp' && '📱 WhatsApp: '}
                      {form.contactMethod === 'email' && '📧 Email: '}
                      {form.contactMethod === 'telefono' && '☎️ Teléfono: '}
                      {form.contactMethod === 'otro' && '🔗 Contacto: '}
                      {form.contactInfo}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className={styles.publicarButtonRow}>
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className={`${styles.publicarButton} ${styles.secondary}`}
              >
                Anterior
              </button>
            )}
            {/* Ocultar el botón Siguiente en el paso 1 (índice 0) */}
            {step > 0 && step < steps.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className={styles.publicarButton}
                disabled={!isStepValid()}
              >
                Siguiente
              </button>
            )}
            {step === steps.length - 1 && (
              <button type="submit" className={`${styles.publicarButton} ${styles.success}`}>Publicar</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
