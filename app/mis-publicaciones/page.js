"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import RestrictionModal from "../../components/RestrictionModal";

export default function MisPublicaciones() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionData, setRestrictionData] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirigir a login si no está autenticado
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Cargar las publicaciones cuando el usuario esté autenticado
    if (status === "authenticated") {
      fetchPublicaciones();
    }
  }, [status, router]);

  async function fetchPublicaciones() {
    setLoading(true);
    try {
      const res = await fetch("/api/mis-publicaciones");
      const data = await res.json();
      
      if (data.success) {
        setPublicaciones(data.publicaciones);
      } else {
        console.error("Error al cargar publicaciones:", data.error);
      }
    } catch (error) {
      console.error("Error al cargar publicaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    // No confirm here, handled by modal
    try {
      const res = await fetch(`/api/publicacion/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (data.success) {
        setPublicaciones(prev => prev.filter(p => p.id !== id));
        setMessage({
          text: data.message || "Publicación eliminada correctamente",
          type: "success"
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          text: data.error || "Error al eliminar la publicación",
          type: "error"
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({
        text: "Error al eliminar: " + error.message,
        type: "error"
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setShowDeleteModal(false);
    setToDeleteId(null);
  }

  function openDeleteModal(id) {
    setToDeleteId(id);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setToDeleteId(null);
  }

  const checkPostPermissions = async () => {
    try {
      const response = await fetch("/api/check-post-permission");
      const data = await response.json();
      
      if (!data.success || !data.canPost) {
        // User is restricted, show modal
        setRestrictionData({
          reason: data.restrictionReason,
          endsAt: data.restrictionEndsAt,
          error: data.error
        });
        setShowRestrictionModal(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking post permissions:", error);
      // On error, allow user to proceed (fail open)
      return true;
    }
  };

  const handleNewPublication = async () => {
    const canPost = await checkPostPermissions();
    if (canPost) {
      router.push("/publicar");
    }
  };

  const handleRestrictionModalClose = () => {
    setShowRestrictionModal(false);
  };

  // Función para cambiar el estado (activo/inactivo)
  async function handleToggleStatus(id, currentStatus) {
    try {
      const res = await fetch(`/api/publicacion/${id}/toggle-status`, {
        method: "PATCH",
      });
      const data = await res.json();
      
      if (data.success) {
        // Actualizar el estado de la publicación en la lista
        setPublicaciones(prev => 
          prev.map(p => p.id === id ? {...p, status: data.publicacion.status} : p)
        );
        
        // Mostrar mensaje de éxito
        setMessage({
          text: data.message || `La publicación ha sido ${data.publicacion.status === "activo" ? "activada" : "pausada"} correctamente`,
          type: "success"
        });
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          text: data.error || "Error al cambiar el estado de la publicación",
          type: "error"
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({
        text: "Error al cambiar el estado: " + error.message,
        type: "error"
      });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  // Función para editar (navega a una página de edición)
  function handleEdit(id) {
    router.push(`/editar-publicacion/${id}`);
  }

  // Si está cargando, mostrar indicador
  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Mis Publicaciones</h1>
        <div className={styles.loadingContainer}>
          <p>Cargando publicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Modal de restricción */}
      <RestrictionModal
        isOpen={showRestrictionModal}
        onClose={handleRestrictionModalClose}
        restrictionReason={restrictionData?.reason}
        restrictionEndsAt={restrictionData?.endsAt}
      />
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.modalClose} onClick={closeDeleteModal} title="Cerrar">×</button>
            <div className={styles.modalIconWarning}>⚠️</div>
            <h2 className={styles.modalTitle}>¿Eliminar publicación?</h2>
            <p className={styles.modalText}>¿Estás seguro de que quieres eliminar esta publicación? <b>Esta acción no se puede deshacer.</b></p>
            <div className={styles.modalActions}>
              <button onClick={closeDeleteModal} className={styles.cancelButton}>Cancelar</button>
              <button onClick={() => handleDelete(toDeleteId)} className={styles.deleteButton}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.header}>
        <h1 className={styles.title}>Mis Publicaciones</h1>
        <button 
          className={styles.newButton}
          onClick={handleNewPublication}
        >
          Nueva Publicación
        </button>
      </div>

      {publicaciones.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no tienes publicaciones.</p>
          <button 
            className={styles.startButton}
            onClick={handleNewPublication}
          >
            Crear mi primera publicación
          </button>
        </div>
      ) : (
        <div className={styles.publicacionesGrid}>
          {publicaciones.map(pub => (
            <div key={pub.id} className={styles.publicacionCard}>
              <span className={styles.tipoLabel}>
                {pub.type === 'producto' ? 'Producto' : 'Servicio'}
              </span>
              
              {pub.images && pub.images.length > 0 ? (
                <Image 
                  src={pub.images.split(',')[0]} 
                  alt={pub.title} 
                  className={styles.publicacionImage} 
                  width={300} height={200} 
                />
              ) : (
                <div className={styles.noImage}>
                  Sin imagen
                </div>
              )}
              
              <div className={styles.publicacionContent}>
                <h3 className={styles.publicacionTitle}>{pub.title}</h3>
                <p className={styles.publicacionCategory}>
                  <span>Categoría:</span> {pub.category}
                </p>
                <p className={styles.publicacionDescription}>
                  {pub.description}
                </p>
                {pub.price && (
                  <p className={styles.publicacionPrice}>
                    <span>Precio:</span> ${pub.price}
                  </p>
                )}
                <p className={styles.publicacionStatus}>
                  <span>Estado:</span> 
                  <span 
                    className={`${styles.statusIndicator} ${styles[pub.status]}`}
                    title={pub.status === 'activo' 
                      ? 'Esta publicación es visible para todos los usuarios' 
                      : 'Esta publicación está pausada y no es visible para otros usuarios'}
                  >
                    {pub.status === 'activo' ? 'Activo' : 'Pausado'}
                  </span>
                </p>
                
                {pub.hiddenByReports && (
                  <div className={styles.hiddenWarning}>
                    <span className={styles.warningIcon}>⚠️</span>
                    <span>Esta publicación está oculta debido a múltiples reportes y está siendo revisada por nuestro equipo.</span>
                  </div>
                )}
              </div>
              
              <div className={styles.publicacionActions}>
                <button
                  onClick={() => router.push(`/publicacion/${pub.id}`)}
                  className={styles.viewButton}
                  title="Ver publicación como usuario"
                >
                  Ver publicación
                </button>
                <button 
                  onClick={() => handleEdit(pub.id)}
                  className={styles.editButton}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleToggleStatus(pub.id, pub.status)}
                  className={`${styles.toggleButton} ${pub.status === 'activo' ? styles.pauseButton : styles.activateButton}`}
                  title={pub.status === 'activo' ? 'Ocultar temporalmente esta publicación' : 'Hacer visible esta publicación'}
                >
                  {pub.status === 'activo' ? 'Pausar publicación' : 'Activar publicación'}
                </button>
                <button 
                  onClick={() => openDeleteModal(pub.id)}
                  className={styles.deleteButton}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
