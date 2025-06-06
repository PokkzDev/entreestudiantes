"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandHoldingHeart, faStar, faGem, faCrown, faExclamationTriangle, faClipboard } from "@fortawesome/free-solid-svg-icons";
import { 
  getTierColorSync,
  getTierIconSync,
  getTierNameSync
} from "@/lib/accountTiersClient";
import styles from "./page.module.css";
import RestrictionModal from "../../components/RestrictionModal";

// Icon mapping for FontAwesome
const iconMap = {
  "hand-holding-heart": faHandHoldingHeart,
  "star": faStar,
  "gem": faGem,
  "crown": faCrown
};

export default function MisPublicaciones() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [restrictionData, setRestrictionData] = useState(null);
  const [limitData, setLimitData] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
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
        // Set account info from the same API response
        if (data.accountInfo) {
          setAccountInfo(data.accountInfo);
        }
      } else {
        console.error("Error al cargar publicaciones:", data.error);
      }
    } catch (error) {
      console.error("Error al cargar publicaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAccountInfo() {
    try {
      const res = await fetch("/api/check-publication-limits");
      const data = await res.json();
      
      if (data.success) {
        setAccountInfo(data);
      } else {
        console.error("Error al cargar información de cuenta:", data.error);
      }
    } catch (error) {
      console.error("Error al cargar información de cuenta:", error);
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
        // Refresh account info to update counts
        fetchPublicaciones();
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
    // Check if publication is flagged
    const publication = publicaciones.find(p => p.id === id);
    if (publication?.flagged) {
      setMessage({
        text: "No se puede eliminar una publicación marcada para revisión",
        type: "error"
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
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
    // First check if user is restricted
    const canPost = await checkPostPermissions();
    if (!canPost) {
      return;
    }

    // Then check publication limits
    if (accountInfo && !accountInfo.canCreate) {
      setLimitData({
        currentTier: accountInfo.currentTier,
        tierName: accountInfo.tierName,
        currentCount: accountInfo.currentCount,
        limit: accountInfo.limit,
        isUnlimited: accountInfo.isUnlimited
      });
      setShowLimitModal(true);
      return;
    }

    router.push("/publicar");
  };

  const handleRestrictionModalClose = () => {
    setShowRestrictionModal(false);
  };

  const handleLimitModalClose = () => {
    setShowLimitModal(false);
  };

  const getTierIconComponent = (tierKey) => {
    // Use the synchronous function for immediate rendering
    const iconName = getTierIconSync(tierKey);
    const icon = iconMap[iconName];
    return icon ? <FontAwesomeIcon icon={icon} /> : null;
  };

  const getTierColor = (tier) => {
    // Use the synchronous function to get color from database
    return getTierColorSync(tier) || '#6b7280'; // fallback to gray
  };

  // Función para cambiar el estado (activo/inactivo)
  async function handleToggleStatus(id, currentStatus) {
    // Check if publication is flagged
    const publication = publicaciones.find(p => p.id === id);
    if (publication?.flagged) {
      setMessage({
        text: "No se puede cambiar el estado de una publicación marcada para revisión",
        type: "error"
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

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
        
        // Refresh account info to update counts
        fetchAccountInfo();
        
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
    // Check if publication is flagged
    const publication = publicaciones.find(p => p.id === id);
    if (publication?.flagged) {
      setMessage({
        text: "No se puede editar una publicación marcada para revisión",
        type: "error"
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
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
            <div className={styles.modalIconWarning}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b' }} />
            </div>
            <h2 className={styles.modalTitle}>¿Eliminar publicación?</h2>
            <p className={styles.modalText}>¿Estás seguro de que quieres eliminar esta publicación? <b>Esta acción no se puede deshacer.</b></p>
            <div className={styles.modalActions}>
              <button onClick={closeDeleteModal} className={styles.cancelButton}>Cancelar</button>
              <button onClick={() => handleDelete(toDeleteId)} className={styles.deleteButton}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de límite de publicaciones */}
      {showLimitModal && limitData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.modalClose} onClick={handleLimitModalClose} title="Cerrar">×</button>
            <div className={styles.modalIcon} style={{ fontSize: '48px' }}>
              {getTierIconComponent(limitData.currentTier)}
            </div>
            <h2 className={styles.modalTitle}>Límite de publicaciones registradas alcanzado</h2>
            <p className={styles.modalText}>
              Has alcanzado el límite de publicaciones registradas para tu plan <strong>{limitData.tierName}</strong>.
            </p>
            <div className={styles.limitInfo}>
              <div className={styles.limitStat}>
                <span>Publicaciones registradas:</span>
                <strong>{limitData.currentCount} / {limitData.limit || '∞'}</strong>
              </div>
            </div>
            <p className={styles.modalText}>
              {limitData.currentTier === 'free' 
                ? 'Para crear una nueva publicación, debes eliminar una existente o actualizar tu plan para acceder a más publicaciones y funciones premium.'
                : 'Tu suscripción puede haber expirado o necesitas un plan superior.'
              }
            </p>
            <div className={styles.modalActions}>
              <button onClick={handleLimitModalClose} className={styles.cancelButton}>Cerrar</button>
              <button 
                onClick={() => {
                  handleLimitModalClose();
                  router.push('/planes');
                }} 
                className={styles.upgradeButton}
              >
                Ver planes
              </button>
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

      {/* Account tier information */}
      {accountInfo && (
        <div className={styles.accountTierInfo}>
          <div className={styles.tierBadge} style={{ color: getTierColor(accountInfo.currentTier) }}>
            <span className={styles.tierEmoji}>{getTierIconComponent(accountInfo.currentTier)}</span>
            <span className={styles.tierName}>Plan {accountInfo.tierName}</span>
          </div>
          <div className={styles.publicationStats}>
            <span className={styles.statText}>
              Publicaciones registradas: <strong>{accountInfo.currentCount}</strong>
              {accountInfo.isUnlimited ? (
                <span className={styles.unlimitedBadge}> / ∞</span>
              ) : (
                <>
                  <span> / {accountInfo.limit}</span>
                  {accountInfo.remaining > 0 && (
                    <span className={styles.remainingText}> ({accountInfo.remaining} disponibles)</span>
                  )}
                </>
              )}
            </span>
            {accountInfo.activeCount !== undefined && accountInfo.currentTier === 'free' && (
              <span className={styles.activeStatText}>
                (Activas: <strong>{accountInfo.activeCount}</strong>)
              </span>
            )}
            {!accountInfo.isUnlimited && (
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ 
                    width: `${Math.min(100, (accountInfo.currentCount / accountInfo.limit) * 100)}%`,
                    backgroundColor: accountInfo.currentCount >= accountInfo.limit ? '#ef4444' : getTierColor(accountInfo.currentTier)
                  }}
                />
              </div>
            )}
          </div>
          {accountInfo.currentTier === 'free' && (
            <div className={styles.freeUserNotice}>
              <p className={styles.noticeText}>
                <FontAwesomeIcon icon={faClipboard} style={{ marginRight: '8px', color: '#6b7280' }} />
                En el plan Gratuito puedes tener hasta <strong>{accountInfo.limit} publicaciones registradas</strong>. 
                {accountInfo.remaining > 0 ? (
                  <span> Puedes crear <strong>{accountInfo.remaining}</strong> más.</span>
                ) : (
                  <span> <strong>Para crear una nueva, debes eliminar una existente.</strong></span>
                )}
              </p>
              {accountInfo.remaining <= 1 && (
                <div className={styles.upgradePrompt}>
                  <span>¿Necesitas más publicaciones?</span>
                  <button 
                    onClick={() => router.push('/planes')}
                    className={styles.upgradeLink}
                  >
                    Ver planes premium
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                    <span className={styles.warningIcon}>
                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b' }} />
                    </span>
                    <span>Esta publicación está oculta debido a múltiples reportes y está siendo revisada por nuestro equipo.</span>
                  </div>
                )}
                
                {pub.hiddenByAdmin && (
                  <div className={styles.hiddenWarning}>
                    <span className={styles.warningIcon}>
                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626' }} />
                    </span>
                    <span>Esta publicación ha sido ocultada por un administrador.</span>
                  </div>
                )}
                
                {pub.flagged && (
                  <div className={styles.hiddenWarning}>
                    <span className={styles.warningIcon}>
                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444' }} />
                    </span>
                    <span>Esta publicación ha sido marcada para revisión y no puede ser editada hasta que sea revisada por nuestro equipo.</span>
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
                  disabled={pub.flagged}
                  title={pub.flagged ? 'No se puede editar una publicación marcada para revisión' : 'Editar publicación'}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleToggleStatus(pub.id, pub.status)}
                  className={`${styles.toggleButton} ${pub.status === 'activo' ? styles.pauseButton : styles.activateButton}`}
                  disabled={pub.flagged}
                  title={pub.flagged 
                    ? 'No se puede cambiar el estado de una publicación marcada para revisión'
                    : (pub.status === 'activo' ? 'Ocultar temporalmente esta publicación' : 'Hacer visible esta publicación')
                  }
                >
                  {pub.status === 'activo' ? 'Pausar publicación' : 'Activar publicación'}
                </button>
                <button 
                  onClick={() => openDeleteModal(pub.id)}
                  className={styles.deleteButton}
                  disabled={pub.flagged}
                  title={pub.flagged ? 'No se puede eliminar una publicación marcada para revisión' : 'Eliminar publicación'}
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
