"use client";
import Image from "next/image";
import { getCategoryLabel } from "../lib/categoryOptions";
import styles from "./PublicationCard.module.css";

const PublicationCard = ({ 
  publication, 
  index = 0, 
  onActionClick,
  onClick,
  priority = false,
  actionButton = null // New prop to customize the action button
}) => {
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

  // Función para formatear fechas
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle action click
  const handleActionClick = (e) => {
    e.stopPropagation(); // Evitar que se abra la publicación
    if (onActionClick) {
      onActionClick(e, publication);
    }
  };

  // Handle card click
  const handleClick = () => {
    if (onClick) {
      onClick(publication);
    } else {
      // Default behavior: navigate to publication detail
      window.location.href = `/publicacion/${publication.id}`;
    }
  };

  return (
    <div 
      className={styles.publicationCard} 
      data-type={publication.type} 
      onClick={handleClick}
      style={{ 
        cursor: 'pointer',
        '--card-index': index
      }}
    >
      <span className={styles.tipoLabel}>
        {publication.type === 'producto' ? 'Producto' : 'Servicio'}
      </span>
      
      {/* Customizable Action Button */}
      {actionButton && (
        <button
          className={actionButton.className || styles.actionButtonCard}
          onClick={handleActionClick}
          title={actionButton.title}
          disabled={actionButton.disabled}
        >
          {actionButton.icon}
        </button>
      )}
      
      {/* Image Section */}
      {publication.images && publication.images.length > 0 ? (
        <div className={styles.imageContainer}>
          <Image
            src={(() => {
              const img = publication.images.split(",")[0].trim();
              if (!img) return "";
              if (img.startsWith("/images/") || img.startsWith("http")) return img;
              return `/images/${img.replace(/^\/+/, "")}`;
            })()}
            alt={publication.title}
            width={300}
            height={200}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            priority={priority}
          />
        </div>
      ) : (
        <div className={styles.noImage}>Sin imagen</div>
      )}
      
      {/* Content Section */}
      <div className={styles.cardContent}>
        {/* Top Meta Section */}
        <div className={styles.topMeta}>
          <div className={styles.categoria}>
            <b>Categoría:</b> {getCategoryLabel(publication.category)}
          </div>
          
          {(publication.university || publication.campus) && (
            <div className={styles.universidad}>
              <b>Institución:</b> {publication.university}
              {publication.campus && <span> - {publication.campus}</span>}
            </div>
          )}
          
          <div className={styles.fechaPublicacion}>
            <b>Publicado:</b> {formatDate(publication.createdAt)}
          </div>
        </div>
        
        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.contentFlow}>
            <h3>{publication.title}</h3>
            <p className={styles.description}>{publication.description}</p>
          </div>
        </div>
        
        {/* Price Section */}
        {publication.price && (
          <div className={styles.priceSection}>
            <div className={styles.precio}>${formatNumber(publication.price)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicationCard; 