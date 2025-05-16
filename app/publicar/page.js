"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";
import { categoryOptions, getProductCategories, getServiceCategories, getCategoryLabel } from "@/lib/categoryOptions";
import Image from 'next/image';

// Move "Imágenes" step before "Contacto"
const steps = [
  "Tipo",
  "Categoría",
  "Detalles",
  "Imágenes",
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
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Función para formatear números con puntos para separar miles y comas para decimales
  const formatNumber = (num) => {
    if (!num) return '0';
    
    // Separar la parte entera y decimal
    let [integerPart, decimalPart] = num.toString().split('.');
    
    // Formatear la parte entera con puntos como separadores de miles
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Devolver el número formateado with coma para decimales si existe parte decimal
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

  // Handle image selection and preview
  function handleImageChange(e) {
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const maxFileSize = 1024 * 1024; // 1MB
    const files = Array.from(e.target.files);
    const validFiles = [];
    let errorMessages = [];
    let availableSlots = 4 - imagePreviews.length;

    for (const file of files) {
      if (validFiles.length >= availableSlots) break;
      // Check MIME type
      if (!file.type.startsWith("image/")) {
        errorMessages.push(`El archivo '${file.name}' no es una imagen válida.`);
        continue;
      }
      // Check extension
      const ext = file.name.split(".").pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        errorMessages.push(`El archivo '${file.name}' tiene una extensión no permitida.`);
        continue;
      }
      // Check file size
      if (file.size > maxFileSize) {
        errorMessages.push(`El archivo '${file.name}' supera el tamaño máximo de 1MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (errorMessages.length > 0) {
      alert(errorMessages.join("\n"));
    }

    if (validFiles.length > 0) {
      setForm(f => ({ ...f, images: [...(f.images || []), ...validFiles] }));
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }

    if (files.length > availableSlots) {
      alert(`Solo se han agregado ${availableSlots} imágenes para no exceder el límite de 4 imágenes.`);
    }
  }
  
  // Handle removing an image
  function handleRemoveImage(index) {
    setForm(f => {
      const updatedImages = [...(f.images || [])];
      updatedImages.splice(index, 1);
      return { ...f, images: updatedImages };
    });
    
    setImagePreviews(prev => {
      const updatedPreviews = [...prev];
      updatedPreviews.splice(index, 1);
      return updatedPreviews;
    });
  }

  // Handle image upload to server
  async function handleImageUpload() {
    if (!form.images || form.images.length === 0) return [];
    setUploading(true);
    const uploadedUrls = [];
    for (const file of form.images) {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        uploadedUrls.push(data.url);
      }
    }
    setUploading(false);
    return uploadedUrls;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Check if user is authenticated
    if (status !== "authenticated" || !session?.user?.id) {
      alert("Debes iniciar sesión para publicar");
      router.push("/login");
      return;
    }

    // Upload images first
    let imageUrls = [];
    if (form.images && form.images.length > 0 && typeof form.images[0] !== 'string') {
      imageUrls = await handleImageUpload();
    } else if (form.images && typeof form.images[0] === 'string') {
      imageUrls = form.images;
    }

    const formData = {
      ...form,
      images: imageUrls,
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

  const minPriceValue = 10; // Precio mínimo permitido

  function isStepValid() {
    if (step === 0) {
      return true;
    }
    if (step === 1) {
      return !!form.category;
    }
    if (step === 2) {
      const titleValid = form.title.trim().length >= 5 && form.title.trim().length <= 40;
      const descValid = form.description.trim().length >= 20 && form.description.trim().length <= 200;
      if (form.type === 'producto') {
        if (form.priceRange) {
          const min = form.priceMin && /^\d+(\.\d{1,2})?$/.test(form.priceMin) && parseFloat(form.priceMin) >= minPriceValue;
          const max = form.priceMax && /^\d+(\.\d{1,2})?$/.test(form.priceMax) && parseFloat(form.priceMax) >= minPriceValue;
          const priceValid = min && max && parseFloat(form.priceMin) <= parseFloat(form.priceMax);
          return (
            titleValid &&
            descValid &&
            priceValid
          );
        } else {
          return (
            titleValid &&
            descValid &&
            form.priceMin && /^\d+(\.\d{1,2})?$/.test(form.priceMin) && parseFloat(form.priceMin) >= minPriceValue
          );
        }
      } else if (form.type === 'servicio') {
        // Para servicios, solo precio base obligatorio
        return (
          titleValid &&
          descValid &&
          form.priceMin && /^\d+(\.\d{1,2})?$/.test(form.priceMin) && parseFloat(form.priceMin) >= minPriceValue
        );
      } else {
        return (
          titleValid &&
          descValid
        );
      }
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      if (form.contactMethod === 'whatsapp' || form.contactMethod === 'telefono') {
        // Must be exactly 9 digits
        return /^\d{9}$/.test(form.contactInfo);
      }
      if (form.contactMethod === 'email') {
        // Simple email regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactInfo);
      }
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
              {(form.type === 'producto' ? getProductCategories() : getServiceCategories())
                .map(groupObj => (
                  <optgroup key={groupObj.group} label={groupObj.group}>
                    {groupObj.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="priceType"
                        checked={!form.priceRange}
                        onChange={() => setForm(f => ({ ...f, priceRange: false, priceMax: '', priceMin: '' }))}
                        style={{ accentColor: '#6366f1', marginRight: 2 }}
                        disabled={form.type === 'servicio'}
                      />
                      Precio fijo
                    </label>
                    {form.type === 'producto' && (
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
                    )}
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
                  <span style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {form.type === 'servicio'
                      ? 'Puedes definir un precio base para tu servicio.'
                      : 'Puedes definir un rango de precios si tu producto lo requiere.'}
                  </span>
                </div>
              )}
            </>
          )}
          {step === 3 && (
            <div>
              <label className={styles.publicarLabel}>Sube imágenes (opcional, máximo 4):</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={uploading || imagePreviews.length >= 4}
                className={styles.publicarInput}
                style={{ marginBottom: 8 }}
              />
              <div className={styles.imagePreviewGrid}>
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className={styles.imagePreviewItem}>
                    <Image
                      src={src}
                      alt="preview"
                      className={styles.imagePreviewImg}
                      width={80}
                      height={80}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className={styles.imagePreviewDeleteBtn}
                      title="Eliminar imagen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {imagePreviews.length >= 4 && (
                <div style={{ color: '#f43f5e', fontSize: '14px', marginTop: '4px' }}>
                  Has alcanzado el límite de 4 imágenes.
                </div>
              )}
              {uploading && <div style={{ color: '#6366f1' }}>Subiendo imágenes...</div>}
            </div>
          )}
          {step === 4 && (
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
                      // Only allow numbers, max 9 digits
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
          )}
          {step === 5 && (
            <div className={styles.publicacionReview}>
              <h3 className={styles.reviewTitle}>Así se verá tu publicación</h3>
              <div className={styles.publicacionCard}>
                <div className={styles.publicacionCardHeader}>
                  <div className={styles.publicacionCategoryBadge}>
                    {getCategoryLabel(form.category)}
                  </div>
                  <div className={styles.publicacionType}>
                    {form.type === 'servicio' ? '🛠️ Servicio' : '📦 Producto'}
                  </div>
                </div>
                <h2 className={styles.publicacionTitle}>{form.title}</h2>
                <p className={styles.publicacionDescription}>{form.description}</p>
                <div className={styles.publicacionDetails}>
                  {(form.type === "producto" || form.type === "servicio") && (
                    <div className={styles.publicacionPrice}>
                      <span className={styles.priceLabel}>Precio:</span>
                      <span className={styles.priceValue}>
                        {form.type === 'producto' && form.priceRange
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
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.images && form.images.length > 0 && form.images.map((img, idx) => (
                    <Image key={idx} src={typeof img === 'string' ? img : imagePreviews[idx]} alt="imagen" width={80} height={80} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} />
                  ))}
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
