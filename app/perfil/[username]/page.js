"use client";
import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import styles from "./page.module.css";
import { FaCalendarAlt, FaUniversity, FaMapMarkerAlt, FaUser, FaArrowLeft, FaStar, FaFlag } from "react-icons/fa";
import { getCategoryLabel } from "@/lib/categoryOptions";
import StarRating from "@/components/StarRating";
import RatingModal from "@/components/RatingModal";
import ReportModal from "@/components/ReportModal";

export default function PerfilUsuario(props) {
  // Handle params properly - React.use() should not be in try/catch
  let params;
  
  // If props.params is a promise, use React.use() to resolve it
  if (props.params && typeof props.params.then === 'function') {
    params = React.use(props.params);
  } else {
    // If props.params is already an object, use it directly
    params = props.params || {};
  }
  
  const username = params?.username;
  const router = useRouter();
  const { data: session } = useSession();
  const [usuario, setUsuario] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingRating, setReportingRating] = useState(null);
  const [showUserReportModal, setShowUserReportModal] = useState(false);

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
          setRecentRatings(data.recentRatings || []);
        } else {
          setUsuario(null);
          setPublicaciones([]);
          setRecentRatings([]);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUsuario(null);
        setPublicaciones([]);
        setRecentRatings([]);
      }
      setLoading(false);
    }
    fetchUserProfile();
  }, [username]);

  const fetchUserRating = useCallback(async () => {
    if (!usuario?.id || !session?.user?.id) return;
    
    try {
      const res = await fetch(`/api/rating?userId=${usuario.id}&raterId=${session.user.id}`);
      const data = await res.json();
      if (data.success && data.ratings.length > 0) {
        setUserRating(data.ratings[0]);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  }, [usuario?.id, session?.user?.id]);

  // Fetch user's existing rating
  useEffect(() => {
    if (session && usuario && session.user.id !== usuario.id) {
      fetchUserRating();
    }
  }, [session, usuario, fetchUserRating]);

  const handleRatingSubmit = async ({ rating, comment }) => {
    setRatingLoading(true);
    try {
      const res = await fetch('/api/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ratedUserId: usuario.id,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUserRating(data.rating);
        // Refresh user profile to get updated rating stats
        const profileRes = await fetch(`/api/perfil/${username}`);
        const profileData = await profileRes.json();
        if (profileData.success) {
          setUsuario(profileData.user);
          setRecentRatings(profileData.recentRatings || []);
        }
      } else {
        throw new Error(data.error || 'Error al enviar calificación');
      }
    } catch (error) {
      throw error;
    } finally {
      setRatingLoading(false);
    }
  };

  const handleOpenReportModal = (rating) => {
    console.log('Opening report modal for rating:', rating);
    console.log('Rating ID:', rating?.id);
    console.log('Rating object keys:', Object.keys(rating || {}));
    
    if (!rating?.id) {
      console.error('Cannot report rating: missing ID');
      return;
    }
    
    setReportingRating(rating);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportingRating(null);
  };

  const handleOpenUserReportModal = () => {
    setShowUserReportModal(true);
  };

  const handleCloseUserReportModal = () => {
    setShowUserReportModal(false);
  };

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
      {/* Header with back button and actions */}
      <div className={styles.headerActions}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <FaArrowLeft /> Volver
        </button>
        
        {/* Report user button - only show for other users when logged in */}
        {session && session.user.id !== usuario.id && (
          <button
            className={styles.reportUserButton}
            onClick={handleOpenUserReportModal}
            title="Reportar usuario"
          >
            <FaFlag /> Reportar usuario
          </button>
        )}
      </div>

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
            
            {/* Quick rating summary */}
            {usuario.totalRatings > 0 && (
              <div className={styles.quickRating}>
                <FaStar className={styles.quickRatingIcon} />
                <span className={styles.quickRatingValue}>
                  {usuario.averageRating.toFixed(1)}
                </span>
                <span className={styles.quickRatingCount}>
                  ({usuario.totalRatings})
                </span>
              </div>
            )}
            
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

      {/* Publications section - Show what the user offers first */}
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

      {/* Unified Rating section - After seeing publications, users can rate */}
      <div className={styles.ratingSectionStandalone}>
        <div className={styles.ratingHeader}>
          <h2 className={styles.ratingMainTitle}>Calificaciones</h2>
          <div className={styles.ratingDisplay}>
            <StarRating
              rating={usuario.averageRating}
              readonly={true}
              showCount={true}
              totalRatings={usuario.totalRatings}
              size="medium"
            />
          </div>
        </div>
        
        {session && session.user.id !== usuario.id && (
          <div className={styles.rateButtonContainer}>
            <p className={styles.ratePrompt}>
              ¿Has tenido alguna experiencia con {usuario.name || usuario.username}?
            </p>
            <button
              className={styles.rateButton}
              onClick={() => setShowRatingModal(true)}
            >
              <FaStar />
              {userRating ? 'Editar mi calificación' : 'Calificar usuario'}
            </button>
          </div>
        )}

        {/* Recent ratings within the same section */}
        {recentRatings.length > 0 && (
          <div className={styles.ratingsSubsection}>
            <h3 className={styles.ratingsSubtitle}>Lo que dicen otros usuarios</h3>
            <div className={styles.ratingsList}>
              {recentRatings.map((rating, index) => (
                <div key={index} className={styles.ratingItem}>
                  <div className={styles.ratingItemHeader}>
                    <div className={styles.raterInfo}>
                      <div className={styles.raterAvatar}>
                        {rating.rater.image ? (
                          <Image
                            src={rating.rater.image}
                            alt={rating.rater.name || rating.rater.username}
                            width={32}
                            height={32}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {(rating.rater.name || rating.rater.username)?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={styles.raterName}>
                          {rating.rater.name || rating.rater.username}
                        </span>
                        <StarRating rating={rating.rating} readonly={true} size="small" />
                      </div>
                    </div>
                    <div className={styles.ratingActions}>
                      <span className={styles.ratingDate}>
                        {formatDate(rating.createdAt)}
                      </span>
                      {session && session.user.id !== rating.raterId && (
                        <button
                          className={styles.reportButton}
                          onClick={() => handleOpenReportModal(rating)}
                          title="Reportar calificación"
                        >
                          <FaFlag />
                        </button>
                      )}
                    </div>
                  </div>
                  {rating.comment && (
                    <p className={styles.ratingComment}>{rating.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        user={usuario}
        onSubmit={handleRatingSubmit}
        existingRating={userRating}
        isLoading={ratingLoading}
      />

      {/* Report Modal for ratings */}
      <ReportModal
        isOpen={showReportModal && !!reportingRating}
        onClose={handleCloseReportModal}
        ratingId={reportingRating?.id}
        ratingInfo={reportingRating ? {
          raterName: reportingRating.rater?.name || reportingRating.rater?.username,
          comment: reportingRating.comment,
          rating: reportingRating.rating
        } : null}
      />

      {/* Report Modal for user */}
      <ReportModal
        isOpen={showUserReportModal}
        onClose={handleCloseUserReportModal}
        reportedUserId={usuario?.id}
        reportedUserInfo={usuario ? {
          name: usuario.name,
          username: usuario.username
        } : null}
      />
    </div>
  );
} 