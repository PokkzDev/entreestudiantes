"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { FaWhatsapp, FaEnvelope, FaPhone, FaRegAddressCard, FaMapMarkerAlt, FaTag, FaTags, FaCalendarAlt, FaIdCard, FaDollarSign, FaChevronLeft, FaChevronRight, FaTimes, FaArrowLeft, FaUniversity, FaFlag, FaUser, FaEye, FaInfo, FaHeart, FaShare } from "react-icons/fa";
import Image from 'next/image';
import { getCategoryLabel } from "@/lib/categoryOptions";
import ReportModal from "@/components/ReportModal";
import ModalContactWarning from "@/components/ModalContactWarning";

export default function PublicacionDetalle(props) {
  // Next.js 14+: params es una promesa, usar React.use() para obtener el valor
  const params = React.use(props.params);
  const id = params?.id;
  const router = useRouter();
  const [publicacion, setPublicacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  // Estados para el modal de advertencia de contacto
  const [showContactWarning, setShowContactWarning] = useState(false);
  const [pendingContactInfo, setPendingContactInfo] = useState(null);

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
    }
    handleCloseContactWarning();
  };

  // Share functionality
  const handleShare = async () => {
    if (!publicacion) return;

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
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideInDown 0.3s ease-out reverse';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
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
          {/* <button className={styles.actionButton} title="Guardar">
            <FaHeart />
          </button> */}
          <button
            className={styles.actionButton}
            onClick={handleReport}
            title="Reportar esta publicación"
          >
            <FaFlag />
          </button>
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
