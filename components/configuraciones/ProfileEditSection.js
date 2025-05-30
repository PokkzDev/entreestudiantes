import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import styles from "./ProfileEditSection.module.css";
import buttonStyles from "@/styles/buttons.module.css";
import { formatRutInput, validateRut } from "@/utils/rutValidation";

export default function ProfileEditSection({ session, onProfileUpdate }) {
  const { data: sessionData, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // Loading state for initial data fetch
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now()); // For cache busting
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    username: "",
    image: "",
    email: "", // Add email to formData instead of using session
    rut: "", // RUT del usuario para pagos de MercadoPago
    nameChangeCount: 0,
    usernameChangeCount: 0
  });

  const fileInputRef = useRef(null);

  // Helper function to add cache busting to image URLs
  const getCacheBustedImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}v=${imageKey}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage("El archivo supera el tamaño máximo de 5MB");
      setSuccess(false);
      return;
    }

    setImageUploading(true);
    setMessage("");

    try {
      const formDataObj = new FormData();
      formDataObj.append("image", file);
      formDataObj.append("type", "profile");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formDataObj,
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          image: result.url
        }));
        // Update cache busting key for new image
        setImageKey(Date.now());
        // Update session with new image using the special route
        await fetch("/api/update-session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: result.url })
        });
        // Optionally, force a session refresh so UI updates everywhere
        await update();
        
        // Dispatch event to update Navbar immediately
        if (typeof window !== "undefined") {
          const profileUpdatedEvent = new CustomEvent("profile-updated", {
            detail: {
              ...formData,
              image: result.url
            }
          });
          window.dispatchEvent(profileUpdatedEvent);
        }
        
        setMessage("Imagen subida correctamente");
        setSuccess(true);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "Error al subir la imagen");
        setSuccess(false);
      }
    } catch (error) {
      setMessage("Error de red al subir la imagen");
      setSuccess(false);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.image) return;

    setImageUploading(true);
    setMessage("");

    try {
      // Call the delete image API
      const response = await fetch("/api/delete-image", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: formData.image }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setFormData(prev => ({
          ...prev,
          image: ""
        }));
        
        // Update cache busting key to force refresh
        setImageKey(Date.now());
        
        // Update session with the new user data
        await update({
          nombre: result.user.nombre,
          apellidos: result.user.apellidos,
          username: result.user.username,
          email: result.user.email,
          image: result.user.image,
          nameChangeCount: result.user.nameChangeCount,
          usernameChangeCount: result.user.usernameChangeCount
        });

        // Dispatch event to update Navbar immediately
        if (typeof window !== "undefined") {
          const profileUpdatedEvent = new CustomEvent("profile-updated", {
            detail: result.user
          });
          window.dispatchEvent(profileUpdatedEvent);
        }
        
        setMessage("Imagen eliminada correctamente");
        setSuccess(true);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "Error al eliminar la imagen");
        setSuccess(false);
      }
    } catch (error) {
      console.error("Error removing image:", error);
      setMessage("Error de red al eliminar la imagen");
      setSuccess(false);
    } finally {
      setImageUploading(false);
    }
  };

  // Function to validate and format RUT
  const validateAndFormatRut = (rut) => {
    return formatRutInput(rut);
  };

  const handleRutChange = (e) => {
    const formattedRut = validateAndFormatRut(e.target.value);
    setFormData(prev => ({
      ...prev,
      rut: formattedRut
    }));
  };

  // Fetch user data from the DB (API) and update formData
  const fetchUserData = async () => {
    try {
      setDataLoading(true);
      const res = await fetch("/api/configuraciones", { method: "GET" });
      if (!res.ok) throw new Error("No se pudo obtener el perfil");
      const data = await res.json();
      if (data && data.user) {
        setFormData({
          nombre: data.user.nombre || "",
          apellidos: data.user.apellidos || "",
          username: data.user.username || "",
          image: data.user.image || "",
          email: data.user.email || "",
          rut: data.user.rut || "",
          nameChangeCount: data.user.nameChangeCount || 0,
          usernameChangeCount: data.user.usernameChangeCount || 0
        });
        // Update cache busting key when fetching fresh data
        setImageKey(Date.now());
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // On mount, fetch user data from DB instead of using session initially
  useEffect(() => {
    fetchUserData();
  }, []);

  // After saving, fetch user data again to refresh formData
  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    // Check if user has reached change limits before attempting to save
    const nameChanged = formData.nombre !== session?.user?.nombre || formData.apellidos !== session?.user?.apellidos;
    const usernameChanged = formData.username !== session?.user?.username;
    
    if (nameChanged && formData.nameChangeCount >= 3) {
      setMessage("Has alcanzado el límite máximo de 3 cambios de nombre");
      setSuccess(false);
      setLoading(false);
      return;
    }
    
    if (usernameChanged && formData.usernameChangeCount >= 3) {
      setMessage("Has alcanzado el límite máximo de 3 cambios de nombre de usuario");
      setSuccess(false);
      setLoading(false);
      return;
    }

    // Only send the image if it was changed (uploaded or removed)
    const payload = {
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      username: formData.username,
      rut: formData.rut
    };
    if (formData.image !== session?.user?.image) {
      payload.image = formData.image;
    }

    try {
      const response = await fetch("/api/configuraciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Update cache busting key for fresh image loading
        setImageKey(Date.now());
        
        // Update the session with new data
        await update({
          nombre: result.user.nombre,
          apellidos: result.user.apellidos,
          username: result.user.username,
          email: result.user.email,
          image: result.user.image,
          nameChangeCount: result.user.nameChangeCount,
          usernameChangeCount: result.user.usernameChangeCount
        });
        
        setMessage("Perfil actualizado correctamente");
        setSuccess(true);
        
        // Call parent callback if provided
        if (onProfileUpdate) {
          onProfileUpdate(result.user);
        }
        
        // Fetch latest user data from DB to ensure consistency
        await fetchUserData();

        // Dispatch event to update Navbar and other components after session update
        setTimeout(() => {
          if (typeof window !== "undefined") {
            const profileUpdatedEvent = new CustomEvent("profile-updated", {
              detail: result.user
            });
            window.dispatchEvent(profileUpdatedEvent);
            
            // Keep the old event for backward compatibility
            const imageUpdatedEvent = new Event("profile-image-updated");
            window.dispatchEvent(imageUpdatedEvent);
          }
        }, 100); // Small delay to ensure session is updated
      } else {
        setMessage(result.error || "Error al actualizar el perfil");
        setSuccess(false);
      }
    } catch (error) {
      setMessage("Error de red al actualizar el perfil");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to fresh data from database instead of session
    fetchUserData();
    setMessage("");
  };

  if (dataLoading) {
    return (
      <section className={styles.section}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Cargando información del perfil...</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.editForm}>
        {/* Avatar Edit Section */}
        <div className={styles.avatarEditSection}>
          <div className={styles.avatarContainer}>
            {formData.image ? (
              <Image 
                key={`profile-edit-avatar-${imageKey}`}
                src={getCacheBustedImageUrl(formData.image)}
                alt="Foto de perfil" 
                className={styles.avatar}
                fill
                sizes="96px"
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/pageImages/placeholder_userimage.png";
                }}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
          </div>
          <div>
            <h4 className={styles.sectionSubtitle}>Foto de perfil</h4>
            <div className={styles.avatarActions}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
              <button
                type="button"
                className={`${buttonStyles.primary} ${buttonStyles.small}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                {imageUploading ? "Subiendo..." : "Cambiar foto"}
              </button>
              {formData.image && (
                <button
                  type="button"
                  className={`${buttonStyles.danger} ${buttonStyles.small}`}
                  onClick={handleRemoveImage}
                  disabled={imageUploading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  {imageUploading ? "Eliminando..." : "Eliminar"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionTitle}>Información personal</h4>
          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="nombre" className={styles.label}>Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formData.nameChangeCount >= 3 ? styles.inputDisabled : ''}`}
                  placeholder="Tu nombre"
                  required
                  disabled={formData.nameChangeCount >= 3}
                />
              </div>
            </div>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="apellidos" className={styles.label}>Apellidos</label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formData.nameChangeCount >= 3 ? styles.inputDisabled : ''}`}
                  placeholder="Tu apellido"
                  required
                  disabled={formData.nameChangeCount >= 3}
                />
              </div>
            </div>
          </div>
          
          <div className={styles.changeInfo}>
            <small className={`${styles.fieldHint} ${formData.nameChangeCount >= 3 ? styles.limitReached : ''}`}>
              {formData.nameChangeCount >= 3 
                ? "Has alcanzado el límite máximo de cambios de nombre" 
                : `Cambios de nombre restantes: ${Math.max(3 - (formData.nameChangeCount ?? 0), 0)}`
              }
            </small>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="rut" className={styles.label}>RUT</label>
            <input
              type="text"
              id="rut"
              name="rut"
              value={formData.rut || ""}
              onChange={handleRutChange}
              className={`${styles.input} ${
                formData.rut && formData.rut.length >= 9 
                  ? (validateRut(formData.rut) ? styles.inputValid : styles.inputInvalid)
                  : ''
              }`}
              placeholder="12345678-9"
              maxLength="12"
            />
            <small className={styles.fieldHint}>
              {formData.rut && formData.rut.length >= 9 ? (
                validateRut(formData.rut) ? (
                  <span style={{ color: '#059669' }}>✓ RUT válido</span>
                ) : (
                  <span style={{ color: '#dc2626' }}>✗ RUT inválido - Por favor verifica el dígito verificador</span>
                )
              ) : (
                "Formato: 12345678-9 (sin puntos, con guión)"
              )}
            </small>
          </div>
        </div>

        {/* Account Information Section */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionTitle}>Información de cuenta</h4>
          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Correo electrónico</label>
                <input
                  type="email"
                  value={formData.email || ""}
                  className={`${styles.input} ${styles.inputDisabled}`}
                  disabled
                />
                <small className={styles.fieldHint}>
                  El correo electrónico no se puede cambiar.
                </small>
              </div>
            </div>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="username" className={styles.label}>Nombre de usuario</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`${styles.input} ${formData.usernameChangeCount >= 3 ? styles.inputDisabled : ''}`}
                  placeholder="tu-usuario"
                  minLength={4}
                  required
                  disabled={formData.usernameChangeCount >= 3}
                />
                <small className={`${styles.fieldHint} ${formData.usernameChangeCount >= 3 ? styles.limitReached : ''}`}>
                  {formData.usernameChangeCount >= 3 
                    ? "Has alcanzado el límite máximo de cambios de nombre de usuario" 
                    : `Cambios de usuario restantes: ${Math.max(3 - (formData.usernameChangeCount ?? 0), 0)}`
                  }
                </small>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={success ? styles.successMsg : styles.errorMsg}>
            {message}
          </div>
        )}

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={`${buttonStyles.primary} ${loading ? buttonStyles.loading : ''}`}
            onClick={handleSave}
            disabled={loading || (
              // Disable if trying to change name but reached limit
              (formData.nombre !== session?.user?.nombre && formData.nameChangeCount >= 3) ||
              // Or if trying to change username but reached limit
              (formData.username !== session?.user?.username && formData.usernameChangeCount >= 3)
            )}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            className={buttonStyles.secondary}
            onClick={handleCancel}
            disabled={loading}
          >
            Restablecer
          </button>
        </div>
      </div>
    </section>
  );
}
