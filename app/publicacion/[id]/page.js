"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { FaWhatsapp, FaEnvelope, FaPhone, FaRegAddressCard, FaMapMarkerAlt, FaTag, FaTags, FaCalendarAlt, FaIdCard, FaDollarSign, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import Image from 'next/image';

export default function PublicacionDetalle(props) {
  // Next.js 14+: params es una promesa, usar React.use() para obtener el valor
  const params = React.use(props.params);
  const id = params?.id;
  const [publicacion, setPublicacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchPublicacion() {
      setLoading(true);
      const res = await fetch(`/api/publicacion/${id}`);
      const data = await res.json();
      setPublicacion(data.publicacion || null);
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

  if (loading) return <div className={styles.detalleLoading}>Cargando...</div>;
  if (!publicacion) return <div className={styles.detalleError}>No encontrada.</div>;

  let contactoHref = null;
  let contactoIcon = null;
  if (publicacion.contactMethod === 'whatsapp') {
    const phone = publicacion.contactInfo.replace(/[^\d]/g, '');
    contactoHref = phone ? `https://wa.me/${phone}` : null;
    contactoIcon = <FaWhatsapp className={styles.contactIcon + ' whatsapp-icon'} style={{ color: '#25D366' }} />;
  } else if (publicacion.contactMethod === 'email') {
    contactoHref = `mailto:${publicacion.contactInfo}`;
    contactoIcon = <FaEnvelope className={styles.contactIcon} style={{ color: '#6366f1' }} />;
  } else if (publicacion.contactMethod === 'telefono') {
    const phone = publicacion.contactInfo.replace(/[^\d]/g, '');
    contactoHref = phone ? `tel:${phone}` : null;
    contactoIcon = <FaPhone className={styles.contactIcon} style={{ color: '#10b981' }} />;
  } else {
    contactoIcon = <FaRegAddressCard className={styles.contactIcon} style={{ color: '#64748b' }} />;
  }

  return (
    <div className={`${styles.detalleContainer} ${styles.detalleContainerEnhanced}`}>
      <div className={`${styles.detalleHeader} ${styles.detalleHeaderEnhanced}`}>
        <h1 className={styles.detalleTitulo}>{publicacion.title}</h1>
        <span className={styles.tipoLabel}>{publicacion.type === 'producto' ? 'Producto' : 'Servicio'}</span>
      </div>
      
      {/* Main content section with improved layout */}
      <div className={`${styles.detalleMain} ${styles.detalleMainEnhanced}`}>
        {/* Image section moved to full width for greater prominence */}
        <div className={`${styles.detalleImagesSection} ${styles.detalleImagesSectionFull}`}>
          {publicacion.images && publicacion.images.length > 0 ? (
            <div className={styles.detalleImagesGalleryCenter}>
              <div className={styles.mainImageWrapperLarge} style={{ position: 'relative' }}>
                <Image
                  src={publicacion.images.split(",")[selectedImage]}
                  alt={publicacion.title}
                  className={styles.mainImageLarge}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowCarousel(true)}
                  width={600}
                  height={400}
                  priority={true}
                />
              </div>
              {publicacion.images.split(",").length > 1 && (
                <div className={styles.thumbnailGalleryImproved}>
                  {publicacion.images.split(",").map((img, idx) => (
                    <Image
                      key={idx}
                      src={img}
                      alt={`${publicacion.title} miniatura ${idx + 1}`}
                      className={
                        `${styles.thumbnail} ${selectedImage === idx ? styles.thumbnailSelected : ''}`
                      }
                      onClick={() => setSelectedImage(idx)}
                      width={80}
                      height={80}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noImageLarge}>Sin imagen</div>
          )}
        </div>

        {/* Carousel Modal */}
        {showCarousel && (
          <div className={styles.carouselModalOverlay} onClick={() => setShowCarousel(false)}>
            <div className={styles.carouselModalContent} onClick={e => e.stopPropagation()}>
              {/* Left arrow */}
              {publicacion.images.split(",").length > 1 && (
                <button
                  className={styles.carouselArrowModal}
                  style={{ left: 0 }}
                  aria-label="Anterior"
                  onClick={() => setSelectedImage((prev) => (prev - 1 + publicacion.images.split(",").length) % publicacion.images.split(",").length)}
                >
                  <FaChevronLeft />
                </button>
              )}
              <Image
                src={publicacion.images.split(",")[selectedImage]}
                alt={publicacion.title}
                className={styles.carouselModalImage}
                width={600}
                height={400}
              />
              {/* Right arrow */}
              {publicacion.images.split(",").length > 1 && (
                <button
                  className={styles.carouselArrowModal}
                  style={{ right: 0 }}
                  aria-label="Siguiente"
                  onClick={() => setSelectedImage((prev) => (prev + 1) % publicacion.images.split(",").length)}
                >
                  <FaChevronRight />
                </button>
              )}
              <button className={styles.carouselCloseButton} onClick={() => setShowCarousel(false)} aria-label="Cerrar">
                <FaTimes />
              </button>
            </div>
          </div>
        )}
        
        {/* Information section below the images */}
        <div className={`${styles.detalleInfoSection} ${styles.detalleInfoSectionEnhanced}`}>
          <div className={styles.infoGroup}>
            <p className={styles.precio}><FaDollarSign /> <b>Precio:</b> ${formatNumber(publicacion.price)}</p>
            <p className={styles.categoria}><FaTag /> <b>Categoría:</b> {publicacion.category}</p>
            {publicacion.tags && (
              <p className={styles.tags}><FaTags /> <b>Tags:</b> {publicacion.tags}</p>
            )}
            {publicacion.location && (
              <p className={styles.location}><FaMapMarkerAlt /> <b>Ubicación:</b> {publicacion.location}</p>
            )}
          </div>
          <div className={styles.infoGroup}>
            <h3 className={styles.descripcionTitle}>Descripción</h3>
            <p className={styles.descripcion}>{publicacion.description}</p>
          </div>
          <div className={`${styles.contactoBox} ${styles.contactoBoxEnhanced}`}>
            <span className={styles.contactoLabel}>Contacto:</span>
            {contactoHref ? (
              <a href={contactoHref} target="_blank" rel="noopener noreferrer" className={styles.contactoLink}>{contactoIcon} <span className={styles.contactoText}>{publicacion.contactInfo}</span></a>
            ) : (
              <span>{contactoIcon} <span className={styles.contactoText}>{publicacion.contactInfo}</span></span>
            )}
          </div>
        </div>
      </div>
      <div className={`${styles.detalleFooter} ${styles.detalleFooterEnhanced}`}>
        {publicacion.createdAt && (
          <span className={styles.detalleFecha} style={{ marginLeft: 'auto' }}><FaCalendarAlt /> Publicado: {formatDate(publicacion.createdAt)}</span>
        )}
      </div>
    </div>
  );
}

// Helper to format date as DD/MM/YYYY
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
