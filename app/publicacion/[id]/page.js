"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { FaWhatsapp, FaEnvelope, FaPhone, FaRegAddressCard, FaMapMarkerAlt, FaTag, FaTags, FaCalendarAlt, FaIdCard, FaDollarSign, FaChevronLeft, FaChevronRight, FaTimes, FaArrowLeft, FaUniversity, FaFlag } from "react-icons/fa";
import Image from 'next/image';
import { getCategoryLabel } from "@/lib/categoryOptions";
import ReportModal from "@/components/ReportModal";

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
      {/* Back button */}
      <button 
        className={styles.backButton}
        onClick={() => router.back()}
      >
        <FaArrowLeft /> Volver
      </button>

      {/* Main publication card */}
      <div className={`${styles.publicacionCard} ${styles[`card-${publicacion.type}`]}`}>
        {/* Type label */}
        <span className={styles.tipoLabel}>
          {publicacion.type === 'producto' ? 'Producto' : 'Servicio'}
        </span>

        {/* Image section */}
        <div className={styles.imageSection}>
          {images.length > 0 ? (
            <div className={styles.imageGallery}>
              <div className={styles.mainImageContainer}>
                <Image
                  src={(() => {
                    const img = images[selectedImage];
                    if (!img) return "";
                    // If already starts with /images/ or is a full URL, use as is
                    if (img.startsWith("/images/") || img.startsWith("http")) return img;
                    // Otherwise, prepend /images/
                    return `/images/${img.replace(/^\/+/, "")}`;
                  })()}
                  alt={publicacion.title}
                  className={styles.mainImage}
                  onClick={() => setShowCarousel(true)}
                  width={600}
                  height={400}
                  priority={true}
                />
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
              <span>Sin imagen disponible</span>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className={styles.contentSection}>
          <h1 className={styles.titulo}>{publicacion.title}</h1>
          
          {/* Price */}
          {publicacion.price && (
            <div className={styles.precio}>
              <FaDollarSign />
              <span>${formatNumber(publicacion.price)}</span>
            </div>
          )}

          {/* Category */}
          <div className={styles.categoria}>
            <FaTag />
            <span><b>Categoría:</b> {getCategoryLabel(publicacion.category)}</span>
          </div>

          {/* University info */}
          {publicacion.university && (
            <div className={styles.universidad}>
              <FaUniversity />
              <span>
                <b>Institución:</b> {publicacion.university}
                {publicacion.campus && ` - ${publicacion.campus}`}
              </span>
            </div>
          )}

          {/* Location */}
          {publicacion.location && (
            <div className={styles.ubicacion}>
              <FaMapMarkerAlt />
              <span><b>Ubicación:</b> {publicacion.location}</span>
            </div>
          )}

          {/* Tags */}
          {publicacion.tags && (
            <div className={styles.tags}>
              <FaTags />
              <span><b>Tags:</b> {publicacion.tags}</span>
            </div>
          )}

          {/* Description */}
          <div className={styles.descripcionSection}>
            <h3>Descripción</h3>
            <p className={styles.descripcion}>{publicacion.description}</p>
          </div>

          {/* Contact section */}
          <div className={styles.contactoSection}>
            <h3>Contacto</h3>
            <div className={styles.contactoBox}>
              {contactoHref ? (
                <a
                  href={contactoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.contactoLink} ${styles[`contacto-${publicacion.contactMethod}`]}`}
                >
                  {contactoIcon}
                  <span>{contactoText}</span>
                </a>
              ) : (
                <div className={styles.contactoInfo}>
                  {contactoIcon}
                  <span>{contactoText}</span>
                </div>
              )}
            </div>
          </div>

          {/* Author section */}
          {publicacion.author && (
            <div className={styles.authorSection}>
              <h3>Publicado por</h3>
              <div 
                className={styles.authorCard}
                onClick={() => router.push(`/perfil/${publicacion.author.username}`)}
              >
                <div className={styles.authorAvatar}>
                  {publicacion.author.image ? (
                    <Image
                      src={publicacion.author.image}
                      alt={publicacion.author.name || publicacion.author.username}
                      width={48}
                      height={48}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <FaRegAddressCard />
                    </div>
                  )}
                </div>
                <div className={styles.authorInfo}>
                  <h4 className={styles.authorName}>
                    {publicacion.author.name || publicacion.author.username}
                  </h4>
                  <p className={styles.authorUsername}>@{publicacion.author.username}</p>
                  {publicacion.author.university && (
                    <p className={styles.authorUniversity}>
                      <FaUniversity />
                      {publicacion.author.university}
                      {publicacion.author.campus && ` - ${publicacion.author.campus}`}
                    </p>
                  )}
                </div>
                <div className={styles.viewProfileButton}>
                  Ver perfil →
                </div>
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className={styles.footerInfo}>
            <div className={styles.footerLeft}>
              {publicacion.createdAt && (
                <span className={styles.fechaPublicacion}>
                  <FaCalendarAlt />
                  Publicado el {formatDate(publicacion.createdAt)}
                </span>
              )}
              <span className={styles.publicacionId}>
                <FaIdCard />
                ID: {publicacion.id}
              </span>
            </div>
            <button
              className={styles.reportButton}
              onClick={handleReport}
              title="Reportar esta publicación"
            >
              <FaFlag />
              <span>Reportar</span>
            </button>
          </div>
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
    </div>
  );
}
