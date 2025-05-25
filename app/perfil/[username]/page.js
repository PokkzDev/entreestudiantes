"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import { FaCalendarAlt, FaUniversity, FaMapMarkerAlt, FaUser, FaArrowLeft } from "react-icons/fa";
import { getCategoryLabel } from "@/lib/categoryOptions";

export default function PerfilUsuario(props) {
  const params = React.use(props.params);
  const username = params?.username;
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    async function fetchUserProfile() {
      setLoading(true);
      try {
        const res = await fetch(`/api/perfil/${username}`);
        const data = await res.json();
        if (data.success) {
          setUsuario(data.user);
          setPublicaciones(data.publicaciones || []);
        } else {
          setUsuario(null);
          setPublicaciones([]);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUsuario(null);
        setPublicaciones([]);
      }
      setLoading(false);
    }
    fetchUserProfile();
  }, [username]);

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

  if (loading) {
    return (
      <div className={styles.perfilContainer}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className={styles.perfilContainer}>
        <div className={styles.errorState}>
          <h2>Usuario no encontrado</h2>
          <p>El usuario que buscas no existe o no está disponible.</p>
          <button 
            className={styles.backButton}
            onClick={() => router.back()}
          >
            <FaArrowLeft /> Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.perfilContainer}>
      {/* Back button */}
      <button 
        className={styles.backButton}
        onClick={() => router.back()}
      >
        <FaArrowLeft /> Volver
      </button>

      {/* User profile card */}
      <div className={styles.perfilCard}>
        <div className={styles.perfilHeader}>
          <div className={styles.avatarContainer}>
            {usuario.image ? (
              <Image
                src={usuario.image}
                alt={usuario.name || usuario.username}
                className={styles.avatar}
                width={120}
                height={120}
                priority={true}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <FaUser />
              </div>
            )}
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>{usuario.name || usuario.username}</h1>
            <p className={styles.userUsername}>@{usuario.username}</p>
            {usuario.university && (
              <div className={styles.userUniversity}>
                <FaUniversity />
                <span>
                  {usuario.university}
                  {usuario.campus && ` - ${usuario.campus}`}
                </span>
              </div>
            )}
            <div className={styles.userJoined}>
              <FaCalendarAlt />
              <span>Se unió en {formatDate(usuario.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* User stats */}
        <div className={styles.userStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{publicaciones.length}</span>
            <span className={styles.statLabel}>Publicaciones</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {publicaciones.filter(p => p.type === 'producto').length}
            </span>
            <span className={styles.statLabel}>Productos</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {publicaciones.filter(p => p.type === 'servicio').length}
            </span>
            <span className={styles.statLabel}>Servicios</span>
          </div>
        </div>
      </div>

      {/* Publications section */}
      <div className={styles.publicacionesSection}>
        <h2 className={styles.sectionTitle}>
          Publicaciones de {usuario.name || usuario.username}
        </h2>
        
        {publicaciones.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Este usuario aún no tiene publicaciones.</p>
          </div>
        ) : (
          <div className={styles.publicacionesGrid}>
            {publicaciones.map((pub) => (
              <div 
                key={pub.id} 
                className={`${styles.publicacionCard} ${styles[`card-${pub.type}`]}`}
                onClick={() => router.push(`/publicacion/${pub.id}`)}
              >
                <span className={styles.tipoLabel}>
                  {pub.type === 'producto' ? 'Producto' : 'Servicio'}
                </span>
                
                {pub.images && pub.images.length > 0 ? (
                  <div className={styles.imageContainer}>
                    <Image
                      src={(() => {
                        const img = pub.images.split(",")[0].trim();
                        if (!img) return "";
                        if (img.startsWith("/images/") || img.startsWith("http")) return img;
                        return `/images/${img.replace(/^\/+/, "")}`;
                      })()}
                      alt={pub.title}
                      className={styles.publicacionImage}
                      width={300}
                      height={200}
                    />
                  </div>
                ) : (
                  <div className={styles.noImage}>Sin imagen</div>
                )}
                
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{pub.title}</h3>
                  
                  {pub.price && (
                    <p className={styles.cardPrice}>${formatNumber(pub.price)}</p>
                  )}
                  
                  <p className={styles.cardCategory}>
                    <strong>Categoría:</strong> {getCategoryLabel(pub.category)}
                  </p>
                  
                  <p className={styles.cardDescription}>{pub.description}</p>
                  
                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>
                      <FaCalendarAlt />
                      {formatDate(pub.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 