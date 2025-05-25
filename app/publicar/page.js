"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";
import { categoryOptions, getProductCategories, getServiceCategories, getCategoryLabel } from "@/lib/categoryOptions";
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import StepTipo from './StepTipo';
import StepCategoria from './StepCategoria';
import StepDetalles from './StepDetalles';
import StepImagenes from './StepImagenes';
import StepContacto from './StepContacto';
import StepUniversidad from './StepUniversidad';
import StepConfirmar from './StepConfirmar';
import { formatNumber } from './publicarUtils';

// Move "Imágenes" step before "Contacto"
const steps = [
  "Tipo",
  "Categoría",
  "Detalles",
  "Imágenes",
  "Contacto",
  "Universidad",
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

  // Redirect if not authenticated, render nothing while loading
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);
  if (status === "loading") return null;
  if (status === "unauthenticated") return null;

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
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    const maxFileSize = 2 * 1024 * 1024; // 2MB
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
        errorMessages.push(`El archivo '${file.name}' supera el tamaño máximo de 2MB.`);
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
    if (step === 5) {
      // University step is always valid (read-only)
      return true;
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
            <StepTipo form={form} handleTypeSelect={handleTypeSelect} styles={styles} />
          )}
          {step === 1 && (
            <StepCategoria form={form} handleChange={handleChange} styles={styles} getProductCategories={getProductCategories} getServiceCategories={getServiceCategories} />
          )}
          {step === 2 && (
            <StepDetalles form={form} handleChange={handleChange} setForm={setForm} styles={styles} minPriceValue={minPriceValue} />
          )}
          {step === 3 && (
            <StepImagenes imagePreviews={imagePreviews} handleImageChange={handleImageChange} handleRemoveImage={handleRemoveImage} uploading={uploading} styles={styles} />
          )}
          {step === 4 && (
            <StepContacto form={form} handleChange={handleChange} setForm={setForm} styles={styles} />
          )}
          {step === 5 && (
            <StepUniversidad session={session} styles={styles} />
          )}
          {step === 6 && (
            <StepConfirmar form={form} imagePreviews={imagePreviews} styles={styles} formatNumber={formatNumber} getCategoryLabel={getCategoryLabel} />
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
