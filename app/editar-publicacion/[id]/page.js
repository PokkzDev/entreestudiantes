"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { categoryOptions as groupedCategoryOptions } from "../../../lib/categoryOptions";
import styles from "./page.module.css";
import Image from "next/image";

export default function EditarPublicacion() {
  const params = useParams();
  const { id } = params;
  const publicacionId = id;
  const [form, setForm] = useState({
    type: "",
    title: "",
    description: "",
    price: "",
    priceMin: "",
    priceMax: "",
    priceRange: false,
    category: "",
    contactMethod: "",
    contactInfo: "",
    images: "",
    status: "activo",
    location: "",
    tags: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef();

  // Reemplazar categoryOptions por las del archivo centralizado
  // Generar un array plano de opciones para el <select>
  const flatCategoryOptions = groupedCategoryOptions.flatMap((group) =>
    group.options.map((opt) => ({ ...opt, group: group.group }))
  );

  useEffect(() => {
    // Redirigir si no está autenticado
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Cargar datos de la publicación cuando el usuario está autenticado
    if (status === "authenticated") {
      async function fetchPublicacion() {
        setLoading(true);
        try {
          const res = await fetch(`/api/publicacion/${publicacionId}`);
          const data = await res.json();
          if (data.success) {
            const pub = data.publicacion;
            const priceValue = pub.price ? parseFloat(pub.price) : null;
            setForm({
              type: pub.type || "",
              title: pub.title || "",
              description: pub.description || "",
              priceMin: priceValue !== null ? priceValue.toString() : "",
              priceMax: "",
              priceRange: false,
              category: pub.category || "",
              contactMethod: pub.contactMethod || "",
              contactInfo: pub.contactInfo || "",
              images: pub.images ? pub.images.split(",") : [],
              status: pub.status || "activo",
              location: pub.location || "",
              tags: pub.tags || "",
            });
            setImagePreviews(pub.images ? pub.images.split(",") : []);
            setRemovedImages([]);
            setError(null);
          } else {
            setError(data.error || "Error al cargar la publicación");
            setTimeout(() => router.push("/mis-publicaciones"), 3000);
          }
        } catch (err) {
          setError("Error al cargar la publicación: " + err.message);
          setTimeout(() => router.push("/mis-publicaciones"), 3000);
        } finally {
          setLoading(false);
        }
      }
      fetchPublicacion();
    }
  }, [status, publicacionId, router]);

  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    // Limitar a un máximo de 4 imágenes en total
    const currentImageCount = Array.isArray(form.images) ? form.images.length : 0;
    const availableSlots = 4 - currentImageCount;

    if (availableSlots <= 0) {
      alert("Solo puedes subir un máximo de 4 imágenes por publicación.");
      return;
    }

    const filesToAdd = files.slice(0, availableSlots);

    setForm((prev) => ({
      ...prev,
      images: [...(Array.isArray(prev.images) ? prev.images : []), ...filesToAdd],
    }));

    setImagePreviews((prev) => [
      ...prev,
      ...filesToAdd.map((file) => URL.createObjectURL(file)),
    ]);
  }

  function handleRemoveImage(idx) {
    setForm((prev) => {
      const imgs = Array.isArray(prev.images) ? [...prev.images] : [];
      const removed = imgs.splice(idx, 1)[0];
      if (typeof removed === "string") setRemovedImages((rm) => [...rm, removed]);
      return { ...prev, images: imgs };
    });
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleImageUpload() {
    if (!form.images || form.images.length === 0) return [];
    setUploading(true);
    const uploadedUrls = [];
    for (const img of form.images) {
      if (typeof img === "string") {
        uploadedUrls.push(img);
      } else {
        const formData = new FormData();
        formData.append("image", img);
        const res = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) uploadedUrls.push(data.url);
      }
    }
    setUploading(false);
    return uploadedUrls;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = { ...form };
      // Ajustar precio según el tipo
      if (form.type === "producto") {
        if (form.priceRange) {
          formData.priceMin = form.priceMin;
          formData.priceMax = form.priceMax;
        } else {
          formData.priceMin = form.priceMin;
          formData.priceMax = "";
        }
      } else {
        formData.priceMin = "";
        formData.priceMax = "";
      }
      // Subir imágenes nuevas y mantener URLs de las existentes
      formData.images = await handleImageUpload();
      // Eliminar imágenes del storage si fueron removidas
      for (const url of removedImages) {
        await fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      }
      const res = await fetch(`/api/publicacion/${publicacionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/mis-publicaciones");
      } else {
        setError(data.error || "Error al actualizar la publicación");
        setSaving(false);
      }
    } catch (err) {
      setError("Error al guardar: " + err.message);
      setSaving(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "contactMethod") {
      setForm((prev) => ({ ...prev, contactMethod: value, contactInfo: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Editar Publicación</h1>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando información de la publicación...</p>
          <p className={styles.fieldDescription}>
            Por favor espera mientras obtenemos los datos
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Error</h1>
        <div className={styles.errorContainer}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p>{error}</p>
          <p>Redirigiendo a tus publicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Editar Publicación</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.typeSelector}>
          <h3>Tipo de publicación</h3>
          <div className={styles.typeButtons}>
            <button
              type="button"
              className={`${styles.typeButton} ${
                form.type === "producto" ? styles.active : ""
              }`}
              onClick={() => setForm((prev) => ({ ...prev, type: "producto" }))}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              Producto
            </button>
            <button
              type="button"
              className={`${styles.typeButton} ${
                form.type === "servicio" ? styles.active : ""
              }`}
              onClick={() => setForm((prev) => ({ ...prev, type: "servicio" }))}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Servicio
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Título
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Título de tu publicación"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Categoría
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">Selecciona una categoría</option>
            {groupedCategoryOptions
              .filter((group) =>
                form.type === "producto"
                  ? [
                      "Libros y apuntes",
                      "Tecnología",
                      "Papelería y oficina",
                      "Mobiliario y decoración",
                      "Moda y accesorios",
                      "Arte y manualidades",
                      "Deporte y outdoor",
                      "Alimentación y bebidas",
                    ].includes(group.group)
                  : [
                      "Tutorías académicas",
                      "Diseño y multimedia",
                      "Traducción y redacción",
                      "Desarrollo y tecnología",
                      "Asesoría y desarrollo profesional",
                      "Bienestar y estilo de vida",
                      "Eventos y logística",
                    ].includes(group.group)
              )
              .map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe tu producto o servicio"
            required
            className={styles.textarea}
            rows={4}
          />
        </div>

        {(form.type === "producto" || form.type === "servicio") && (
          <div className={styles.formGroup}>
            <label>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Precio
            </label>
            <div className={styles.priceOptions}>
              {form.type === "producto" ? (
                <>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="priceType"
                      checked={!form.priceRange}
                      onChange={() => setForm((prev) => ({ ...prev, priceRange: false }))}
                    />
                    Precio fijo
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="priceType"
                      checked={form.priceRange}
                      onChange={() => setForm((prev) => ({ ...prev, priceRange: true }))}
                    />
                    Rango de precios
                  </label>
                </>
              ) : null}
            </div>

            {/* Solo mostrar el campo de precio fijo para servicios, y ambos para producto según selección */}
            {form.type === "servicio" || !form.priceRange ? (
              <div className={styles.priceInputs}>
                <input
                  type="text"
                  name="priceMin"
                  value={form.priceMin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.]/g, "");
                    setForm((prev) => ({ ...prev, priceMin: value, priceRange: form.type === "servicio" ? false : prev.priceRange }));
                  }}
                  placeholder="Precio"
                  className={styles.input}
                  required
                />
              </div>
            ) : (
              <div className={styles.priceInputs}>
                <input
                  type="text"
                  name="priceMin"
                  value={form.priceMin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.]/g, "");
                    setForm((prev) => ({ ...prev, priceMin: value }));
                  }}
                  placeholder="Precio mínimo"
                  className={styles.input}
                  required
                />
                <span>a</span>
                <input
                  type="text"
                  name="priceMax"
                  value={form.priceMax}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.]/g, "");
                    setForm((prev) => ({ ...prev, priceMax: value }));
                  }}
                  placeholder="Precio máximo"
                  className={styles.input}
                  required
                />
              </div>
            )}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="contactMethod">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Método de contacto
          </label>
          <select
            id="contactMethod"
            name="contactMethod"
            value={form.contactMethod}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">Selecciona un método</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="telefono">Teléfono</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contactInfo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
            Información de contacto
          </label>
          {(form.contactMethod === "telefono" || form.contactMethod === "whatsapp") ? (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
                type="text"
                id="contactInfo"
                name="contactInfo"
                value={form.contactInfo}
                onChange={e => {
                  let value = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setForm(prev => ({ ...prev, contactInfo: value }));
                }}
                placeholder="9 12345678"
                required
                className={styles.input}
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
          ) : (
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              value={form.contactInfo}
              onChange={handleChange}
              placeholder="Tu información de contacto"
              required
              className={styles.input}
            />
          )}
        </div>

        {/* Quitar el campo de estado de la publicación */}

        <div className={styles.formGroup}>
          <label>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 10-2.828-2.828z"
              />
            </svg>
            Imágenes de la publicación (máximo 4)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={uploading}
            className={styles.input}
            style={{ marginBottom: 8 }}
          />
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            {imagePreviews.map((src, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  display: "inline-block",
                }}
              >
                <Image
                  src={
                    typeof form.images[idx] === "string"
                      ? form.images[idx]
                      : src
                  }
                  alt="imagen"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                  }}
                  width={80}
                  height={80}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    boxShadow: "0 1px 4px #0002",
                    cursor: "pointer",
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  title="Eliminar imagen"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {uploading && (
            <div style={{ color: "#6366f1" }}>Subiendo imágenes...</div>
          )}
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
            disabled={saving}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className={styles.buttonSpinner}></div>
                Guardando...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
