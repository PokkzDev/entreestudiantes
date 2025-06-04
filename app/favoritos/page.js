"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import cardStyles from '@/components/PublicationCard.module.css';
import { FaHeart, FaSearch, FaTrash } from 'react-icons/fa';
import PublicationCard from '@/components/PublicationCard';

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

  const handleRemoveFavorite = async (e, publicacion) => {
    if (removingFavorite) return;

    setRemovingFavorite(publicacion.id);
    
    try {
      const res = await fetch(`/api/favorites/${publicacion.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setFavorites(favorites.filter(fav => fav.publicacionId !== publicacion.id));
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
            {favorites.map((favorite, index) => (
              <PublicationCard
                key={favorite.id}
                publication={favorite.publicacion}
                index={index}
                onActionClick={handleRemoveFavorite}
                onClick={(publication) => router.push(`/publicacion/${publication.id}`)}
                priority={index < 4}
                actionButton={{
                  icon: <FaTrash />,
                  title: "Eliminar de favoritos",
                  className: cardStyles.removeButtonCard,
                  disabled: removingFavorite === favorite.publicacion.id
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 