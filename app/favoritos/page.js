"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { FaHeart, FaEye, FaMapMarkerAlt, FaTag, FaCalendarAlt, FaUser, FaDollarSign, FaTrash, FaSearch } from 'react-icons/fa';
import { getCategoryLabel } from '@/lib/categoryOptions';

export default function FavoritosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingFavorite, setRemovingFavorite] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    fetchFavorites();
  }, [session, status, router]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/favorites');
      const data = await res.json();
      
      if (res.ok) {
        setFavorites(data.favorites || []);
      } else {
        console.error('Error fetching favorites:', data.error);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (publicacionId) => {
    if (removingFavorite) return;

    setRemovingFavorite(publicacionId);
    
    try {
      const res = await fetch(`/api/favorites/${publicacionId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setFavorites(favorites.filter(fav => fav.publicacionId !== publicacionId));
        showNotification('Eliminado de favoritos');
      } else {
        const data = await res.json();
        console.error('Error removing favorite:', data.error);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemovingFavorite(null);
    }
  };

  const showNotification = (message) => {
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

  const formatNumber = (num) => {
    if (!num) return '0';
    let [integerPart, decimalPart] = num.toString().split('.');
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <FaHeart className={styles.headerIcon} />
            <h1>Mis Favoritos</h1>
          </div>
          <p className={styles.subtitle}>
            Aquí puedes ver todas las publicaciones que has guardado como favoritas
          </p>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <FaHeart className={styles.emptyIcon} />
            <h2>No tienes favoritos aún</h2>
            <p>Cuando encuentres publicaciones que te interesen, puedes guardarlas como favoritas haciendo clic en el corazón.</p>
            <Link href="/busqueda" className={styles.searchButton}>
              <FaSearch />
              Explorar publicaciones
            </Link>
          </div>
        ) : (
          <div className={styles.favoritesGrid}>
            {favorites.map((favorite) => {
              const publicacion = favorite.publicacion;
              const images = publicacion.images ? publicacion.images.split(",").filter(img => img.trim()) : [];
              const mainImage = images.length > 0 ? images[0] : null;
              
              return (
                <div 
                  key={favorite.id} 
                  className={styles.busquedaCard}
                  data-type={publicacion.type}
                  onClick={() => router.push(`/publicacion/${publicacion.id}`)}
                  style={{ 
                    cursor: 'pointer',
                    '--card-index': 0
                  }}
                >
                  <span className={styles.tipoLabel}>
                    {publicacion.type === 'producto' ? 'Producto' : 'Servicio'}
                  </span>
                  <button
                    className={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleRemoveFavorite(publicacion.id);
                    }}
                    disabled={removingFavorite === publicacion.id}
                    title="Eliminar de favoritos"
                  >
                    <FaTrash />
                  </button>

                  {/* Image Section */}
                  {mainImage ? (
                    <div className={styles.imageContainer}>
                      <Image
                        src={(() => {
                          if (mainImage.startsWith("/images/") || mainImage.startsWith("http")) return mainImage;
                          return `/images/${mainImage.replace(/^\/+/, "")}`;
                        })()}
                        alt={publicacion.title}
                        width={300}
                        height={200}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                        <b>Categoría:</b> {getCategoryLabel(publicacion.category)}
                      </div>
                      
                      {(publicacion.university || publicacion.campus) && (
                        <div className={styles.universidad}>
                          <b>Institución:</b> {publicacion.university}
                          {publicacion.campus && <span> - {publicacion.campus}</span>}
                        </div>
                      )}
                      
                      <div className={styles.fechaPublicacion}>
                        <b>Publicado:</b> {formatDate(publicacion.createdAt)}
                      </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className={styles.mainContent}>
                      <div className={styles.contentFlow}>
                        <h3>{publicacion.title}</h3>
                        <p className={styles.description}>{publicacion.description}</p>
                      </div>
                    </div>
                    
                    {/* Price Section */}
                    {publicacion.price && (
                      <div className={styles.priceSection}>
                        <div className={styles.precio}>${formatNumber(publicacion.price)}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 