"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";
import { FaWhatsapp, FaEnvelope, FaPhone, FaRegAddressCard, FaMapMarkerAlt, FaTag, FaTags, FaCalendarAlt, FaIdCard, FaDollarSign, FaChevronLeft, FaChevronRight, FaTimes, FaArrowLeft, FaUniversity, FaFlag, FaUser, FaEye, FaInfo, FaHeart, FaShare, FaShieldAlt } from "react-icons/fa";
import Image from 'next/image';
import { getCategoryLabel } from "@/lib/categoryOptions";
import ReportModal from "@/components/ReportModal";
import ModalContactWarning from "@/components/ModalContactWarning";
import { usePublicationTracking } from "@/lib/usePageTracking";

export default function PublicacionDetalle(props) {
  // Handle params properly - React.use() should not be in try/catch
  let params;
  
  // If props.params is a promise, use React.use() to resolve it
  if (props.params && typeof props.params.then === 'function') {
    params = React.use(props.params);
  } else {
    // If props.params is already an object, use it directly
    params = props.params || {};
  }
  
  const id = params?.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [publicacion, setPublicacion] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Analytics tracking
  const { 
    trackPublicationView, 
    trackPublicationContact, 
    trackPublicationFavorite,
    trackPublicationShare 
  } = usePublicationTracking(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  // Estados para el modal de advertencia de contacto
  const [showContactWarning, setShowContactWarning] = useState(false);
  const [pendingContactInfo, setPendingContactInfo] = useState(null);
  // Estados para favoritos
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchPublicacion() {
      setLoading(true);
      try {
        const res = await fetch(`/api/publicacion/${id}`);
        const data = await res.json();
        setPublicacion(data.publicacion || null);
      } catch (error) {
        console.error('Error fetching publication:', error);
        setPublicacion(null);
      }
      setLoading(false);
    }
    fetchPublicacion();
  }, [id]);

  // Track publication view when publication is loaded
  useEffect(() => {
    if (publicacion) {
      trackPublicationView({
        title: publicacion.title,
        category: publicacion.category,
        type: publicacion.type,
        authorId: publicacion.authorId,
      });
    }
  }, [publicacion, trackPublicationView]);

  // Check if publication is favorited
  useEffect(() => {
    if (!id || !session?.user?.id) return;
    
    async function checkFavoriteStatus() {
      try {
        const res = await fetch(`/api/favorites/${id}`);
        const data = await res.json();
        setIsFavorited(data.isFavorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    }
    
    checkFavoriteStatus();
  }, [id, session?.user?.id]);

  // Función para formatear números
  const formatNumber = (num) => {
    if (!num) return '0';
    let [integerPart, decimalPart] = num.toString().split('.');
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
  };

  // Helper to format date as DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Report handlers
  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
  };

  // Funciones para manejar el modal de advertencia de contacto
  const handleContactClick = (e, contactMethod, contactInfo, contactHref) => {
    e.preventDefault();
    setPendingContactInfo({
      method: contactMethod,
      info: contactInfo,
      href: contactHref
    });
    setShowContactWarning(true);
  };

  const handleCloseContactWarning = () => {
    setShowContactWarning(false);
    setPendingContactInfo(null);
  };

  const handleConfirmContact = () => {
    if (pendingContactInfo?.href) {
      window.open(pendingContactInfo.href, '_blank', 'noopener,noreferrer');
      // Track contact interaction
      trackPublicationContact(pendingContactInfo.method);
    }
    handleCloseContactWarning();
  };

  // Favorite functionality
  const handleFavorite = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);
    
    try {
      if (isFavorited) {
        // Remove from favorites
        const res = await fetch(`/api/favorites/${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          setIsFavorited(false);
          showFavoriteNotification('Eliminado de favoritos');
          trackPublicationFavorite('remove');
        } else {
          const data = await res.json();
          console.error('Error removing favorite:', data.error);
        }
      } else {
        // Add to favorites
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicacionId: id }),
        });
        
        if (res.ok) {
          setIsFavorited(true);
          showFavoriteNotification('Agregado a favoritos');
          trackPublicationFavorite('add');
        } else {
          const data = await res.json();
          console.error('Error adding favorite:', data.error);
        }
      }
    } catch (error) {
      console.error('Error handling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Helper function to show favorite notification
  const showFavoriteNotification = (message) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #e91e63;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 90vw;
      text-align: center;
      animation: slideInDown 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutUp 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  };

  // Share functionality
  const handleShare = async () => {
    if (!publicacion) return;

    // Track share interaction
    trackPublicationShare();

    const shareUrl = window.location.href;
    const shareData = {
      title: `${publicacion.title} - Entre Estudiantes`,
      text: `${publicacion.description.substring(0, 150)}${publicacion.description.length > 150 ? '...' : ''}`,
      url: shareUrl
    };

    try {
      // Check if Web Share API is supported (mainly on mobile)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      console.error('Native share failed:', error);
      // Continue to fallback if native share fails
    }

    // Fallback options
    try {
      // Try clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showShareNotification('¡Enlace copiado al portapapeles!');
        return;
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
    }

    // Final fallback: select text method for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      if (document.execCommand('copy')) {
        showShareNotification('¡Enlace copiado al portapapeles!');
      } else {
        // If all fails, show prompt
        window.prompt('Copia este enlace:', shareUrl);
      }
      
      document.body.removeChild(textArea);
    } catch (error) {
      console.error('All share methods failed:', error);
      // Last resort: show prompt with URL
      window.prompt('Copia este enlace:', shareUrl);
    }
  };

  // Helper function to show share notification
  const showShareNotification = (message) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 90vw;
      text-align: center;
      animation: slideInDown 0.3s ease-out;
    `;
    
    // Add animation keyframes if they don't exist
    if (!document.querySelector('#shareNotificationStyles')) {
      const style = document.createElement('style');
      style.id = 'shareNotificationStyles';
      style.textContent = `
        @keyframes slideInDown {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        @keyframes slideOutUp {
          from {
            transform: translate(-50%, 0);
            opacity: 1;
          }
          to {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutUp 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  };

  if (loading) {
    return (
      <div className={styles.publicacionContainer}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando publicación...</p>
        </div>
      </div>
    );
  }

  if (!publicacion) {
    return (
      <div className={styles.publicacionContainer}>
        <div className={styles.errorState}>
          <h2>Publicación no encontrada</h2>
          <p>La publicación que buscas no existe o ha sido eliminada.</p>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/busqueda')}
          >
            <FaArrowLeft /> Volver a búsqueda
          </button>
        </div>
      </div>
    );
  }

  // Prepare contact information
  let contactoHref = null;
  let contactoIcon = null;
  let contactoText = publicacion.contactInfo;

  if (publicacion.contactMethod === 'whatsapp') {
    const phone = publicacion.contactInfo.replace(/[^\d]/g, '');
    contactoHref = phone ? `https://wa.me/${phone}` : null;
    contactoIcon = <FaWhatsapp className={styles.contactIcon} />;
  } else if (publicacion.contactMethod === 'email') {
    contactoHref = `mailto:${publicacion.contactInfo}`;
    contactoIcon = <FaEnvelope className={styles.contactIcon} />;
  } else if (publicacion.contactMethod === 'telefono') {
    const phone = publicacion.contactInfo.replace(/[^\d]/g, '');
    contactoHref = phone ? `tel:${phone}` : null;
    contactoIcon = <FaPhone className={styles.contactIcon} />;
  } else {
    contactoIcon = <FaRegAddressCard className={styles.contactIcon} />;
  }

  // Prepare images array
  const images = publicacion.images ? publicacion.images.split(",").filter(img => img.trim()) : [];

  return (
    <div className={styles.publicacionContainer}>
      {/* Navigation Header */}
      <div className={styles.navigationHeader}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <FaArrowLeft /> Volver
        </button>
        
        <div className={styles.actionButtons}>
          <button className={styles.actionButton} title="Compartir" onClick={handleShare}>
            <FaShare />
          </button>
          <button
            className={`${styles.actionButton} ${isFavorited ? styles.favorited : ''} ${favoriteLoading ? styles.favoriteLoading : ''}`}
            onClick={handleFavorite}
            title={isFavorited ? "Eliminar de favoritos" : "Agregar a favoritos"}
            disabled={favoriteLoading}
          >
            <FaHeart />
          </button>
          {/* Only show report button if user is not the author */}
          {session?.user?.id !== publicacion?.authorId && (
            <button
              className={styles.actionButton}
              onClick={handleReport}
              title="Reportar esta publicación"
            >
              <FaFlag />
            </button>
          )}
        </div>
      </div>

      {/* Main publication card with modern design */}
      <div className={`${styles.publicacionCard} ${styles[`card-${publicacion.type}`]}`}>
        
        {/* Hero Section - Images + Basic Info */}
        <div className={styles.heroSection}>
          {/* Image Gallery */}
          <div className={styles.imageSection}>
            {images.length > 0 ? (
              <div className={styles.imageGallery}>
                <div className={styles.mainImageContainer}>
                  <Image
                    src={(() => {
                      const img = images[selectedImage];
                      if (!img) return "";
                      if (img.startsWith("/images/") || img.startsWith("http")) return img;
                      return `/images/${img.replace(/^\/+/, "")}`;
                    })()}
                    alt={publicacion.title}
                    className={styles.mainImage}
                    onClick={() => setShowCarousel(true)}
                    width={600}
                    height={400}
                    priority={true}
                  />
                  {images.length > 1 && (
                    <div className={styles.imageCounter}>
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className={styles.thumbnailGallery}>
                    {images.map((img, idx) => (
                      <Image
                        key={idx}
                        src={(() => {
                          if (!img) return "";
                          if (img.startsWith("/images/") || img.startsWith("http")) return img;
                          return `/images/${img.replace(/^\/+/, "")}`;
                        })()}
                        alt={`${publicacion.title} miniatura ${idx + 1}`}
                        className={`${styles.thumbnail} ${selectedImage === idx ? styles.thumbnailSelected : ''}`}
                        onClick={() => setSelectedImage(idx)}
                        width={80}
                        height={80}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noImage}>
                <FaEye />
                <span>Sin imagen disponible</span>
              </div>
            )}

            {/* Cybersecurity Warning */}
            {images.length > 0 && (
              <div className={styles.securityWarning}>
                <div className={styles.securityWarningIcon}>
                  <FaShieldAlt />
                </div>
                <div className={styles.securityWarningContent}>
                                  <h4 className={styles.securityWarningTitle}>🔒 Mantente Seguro</h4>
                <p className={styles.securityWarningText}>
                  <strong>No escanees QR sospechosos, verifica la identidad del vendedor</strong> y reúnete en lugares públicos seguros. 
                  Desconfía de precios excesivamente bajos y solicita evidencia del producto.
                </p>
                <p className={styles.securityWarningSubtext}>
                  Las imágenes deben mostrar solo el producto. Reporta contenido sospechoso.
                </p>
                </div>
              </div>
            )}
          </div>

          {/* Hero Info Panel */}
          <div className={styles.heroInfo}>
            <div className={styles.typeAndPrice}>
              <span className={styles.tipoLabel}>
                {publicacion.type === 'producto' ? 'Producto' : 'Servicio'}
              </span>
              {publicacion.price && (
                <div className={styles.precio}>
                  <FaDollarSign />
                  <span>${formatNumber(publicacion.price)}</span>
                </div>
              )}
            </div>
            
            <h1 className={styles.titulo}>{publicacion.title}</h1>
            
            <div className={styles.metaInfo}>
              <div className={styles.categoria}>
                <FaTag />
                <span>{getCategoryLabel(publicacion.category)}</span>
              </div>
              
              {publicacion.location && (
                <div className={styles.ubicacion}>
                  <FaMapMarkerAlt />
                  <span>{publicacion.location}</span>
                </div>
              )}
              
              {publicacion.university && (
                <div className={styles.universidad}>
                  <FaUniversity />
                  <span>
                    {publicacion.university}
                    {publicacion.campus && ` - ${publicacion.campus}`}
                  </span>
                </div>
              )}

              {publicacion.createdAt && (
                <div className={styles.fechaPublicacion}>
                  <FaCalendarAlt />
                  <span>Publicado el {formatDate(publicacion.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Quick Contact */}
            <div className={styles.quickContact}>
              {contactoHref ? (
                <button
                  className={`${styles.contactButton} ${styles[`contacto-${publicacion.contactMethod}`]}`}
                  onClick={(e) => handleContactClick(e, publicacion.contactMethod, contactoText, contactoHref)}
                >
                  {contactoIcon}
                  <span>Contactar</span>
                </button>
              ) : (
                <div className={styles.contactButton}>
                  {contactoIcon}
                  <span>Ver contacto</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className={styles.contentSections}>
          
          {/* Description Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <FaInfo />
              <h3>Descripción</h3>
            </div>
            <div className={styles.sectionContent}>
              <p className={styles.descripcion}>{publicacion.description}</p>
              
              {publicacion.tags && (
                <div className={styles.tagsContainer}>
                  <FaTags />
                  <div className={styles.tags}>
                    {publicacion.tags.split(',').map((tag, index) => (
                      <span key={index} className={styles.tag}>
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Author Info */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <FaUser />
              <h3>Publicado por</h3>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.publicationDetails}>
                {/* Author info - simplified */}
                {publicacion.author && (
                  <div 
                    className={styles.authorDetail}
                    onClick={() => router.push(`/perfil/${publicacion.author.username}`)}
                  >
                    <div className={styles.authorMini}>
                      <div className={styles.authorMiniAvatar}>
                        {publicacion.author.image ? (
                          <Image
                            src={publicacion.author.image}
                            alt={publicacion.author.name || publicacion.author.username}
                            width={32}
                            height={32}
                            className={styles.avatarImageMini}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholderMini}>
                            <FaUser />
                          </div>
                        )}
                      </div>
                      <span>@{publicacion.author.username}</span>
                    </div>
                    <span className={styles.verPerfilText}>Ver perfil →</span>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Image carousel modal */}
      {showCarousel && images.length > 0 && (
        <div className={styles.carouselModal} onClick={() => setShowCarousel(false)}>
          <div className={styles.carouselContent} onClick={e => e.stopPropagation()}>
            <button
              className={styles.carouselClose}
              onClick={() => setShowCarousel(false)}
              aria-label="Cerrar"
            >
              <FaTimes />
            </button>
            
            {images.length > 1 && (
              <>
                <button
                  className={`${styles.carouselArrow} ${styles.carouselPrev}`}
                  onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                  aria-label="Anterior"
                >
                  <FaChevronLeft />
                </button>
                <button
                  className={`${styles.carouselArrow} ${styles.carouselNext}`}
                  onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                  aria-label="Siguiente"
                >
                  <FaChevronRight />
                </button>
              </>
            )}
            
            <Image
              src={(() => {
                const img = images[selectedImage];
                if (!img) return "";
                if (img.startsWith("/images/") || img.startsWith("http")) return img;
                return `/images/${img.replace(/^\/+/, "")}`;
              })()}
              alt={publicacion.title}
              className={styles.carouselImage}
              width={800}
              height={600}
            />
          </div>
        </div>
      )}

      {/* Report modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        publicacionId={publicacion?.id}
        publicacionTitle={publicacion?.title}
      />

      {/* Modal de advertencia de contacto */}
      <ModalContactWarning
        open={showContactWarning}
        onClose={handleCloseContactWarning}
        onConfirm={handleConfirmContact}
        contactMethod={pendingContactInfo?.method}
        contactInfo={pendingContactInfo?.info}
      />
    </div>
  );
}
