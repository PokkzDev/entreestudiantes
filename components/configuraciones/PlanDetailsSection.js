"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHandHoldingHeart, 
  faStar, 
  faGem, 
  faCrown, 
  faCreditCard,
  faCalendarAlt,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faArrowUp,
  faHistory
} from "@fortawesome/free-solid-svg-icons";
import { ACCOUNT_TIERS, formatTierName, getTierColor, getTierBgColor, getTierIcon } from "@/lib/accountTiers";
import styles from "./PlanDetailsSection.module.css";

// Icon mapping for FontAwesome
const iconMap = {
  "hand-holding-heart": faHandHoldingHeart,
  "star": faStar,
  "gem": faGem,
  "crown": faCrown
};

export default function PlanDetailsSection() {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchPlanDetails();
  }, []);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/configuraciones/plan-details");
      const data = await response.json();
      
      if (data.success) {
        setPlanData(data);
      } else {
        setMessage(data.error || "Error al cargar información del plan");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
      setMessage("Error al cargar información del plan");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return "Gratis";
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTierIconComponent = (tierKey) => {
    const iconName = getTierIcon(tierKey);
    const icon = iconMap[iconName];
    return icon ? <FontAwesomeIcon icon={icon} /> : null;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FontAwesomeIcon icon={faCheckCircle} className={styles.statusIconActive} />;
      case 'expired':
      case 'cancelled':
        return <FontAwesomeIcon icon={faTimesCircle} className={styles.statusIconInactive} />;
      default:
        return null;
    }
  };

  const getStatusText = (user) => {
    if (user.accountTier === 'free') {
      return { text: 'Activo', className: styles.statusActive };
    }
    
    if (user.subscriptionStatus === 'active') {
      const daysRemaining = getDaysRemaining(user.tierEndDate);
      if (daysRemaining !== null) {
        if (daysRemaining <= 0) {
          return { text: 'Expirado', className: styles.statusExpired };
        } else if (daysRemaining <= 7) {
          return { text: `Expira en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`, className: styles.statusWarning };
        } else {
          return { text: 'Activo', className: styles.statusActive };
        }
      }
    }
    
    return { text: 'Inactivo', className: styles.statusInactive };
  };

  const handleUpgradePlan = () => {
    router.push("/planes");
  };

  const handleCancelSubscription = async () => {
    if (!confirm("¿Estás seguro que deseas cancelar tu suscripción? Esta acción no se puede deshacer.")) {
      return;
    }

    setActionLoading('cancel');
    try {
      const response = await fetch("/api/configuraciones/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Suscripción cancelada exitosamente");
        setMessageType("success");
        fetchPlanDetails(); // Refresh data
      } else {
        setMessage(data.error || "Error al cancelar la suscripción");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      setMessage("Error al cancelar la suscripción");
      setMessageType("error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.loadingContainer}>
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando información del plan...</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className={styles.section}>
        <div className={styles.errorContainer}>
          <p>Error al cargar la información del plan</p>
        </div>
      </div>
    );
  }

  const { user } = planData;
  const currentTier = ACCOUNT_TIERS[user.accountTier];
  const statusInfo = getStatusText(user);

  return (
    <div className={styles.section}>
      <p className={styles.sectionDescription}>
        Gestiona tu plan de suscripción, ve tu historial de pagos y actualiza tu plan.
      </p>

      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      {/* Current Plan Card */}
      <div className={styles.currentPlanCard}>
        <div className={styles.currentPlanHeader}>
          <div className={styles.planIcon} style={{ color: getTierColor(user.accountTier) }}>
            {getTierIconComponent(user.accountTier)}
          </div>
          <div className={styles.planInfo}>
            <h3 className={styles.planName}>{currentTier.name}</h3>
            <div className={styles.planPrice}>
              <span className={styles.price}>{formatPrice(currentTier.price)}</span>
              {currentTier.price > 0 && <span className={styles.period}>/mes</span>}
            </div>
          </div>
          <div className={styles.planStatus}>
            {getStatusIcon(user.subscriptionStatus)}
            <span className={statusInfo.className}>{statusInfo.text}</span>
          </div>
        </div>

        <div className={styles.planFeatures}>
          <h4>Características incluidas:</h4>
          <ul className={styles.featuresList}>
            {currentTier.features.map((feature, index) => (
              <li key={index} className={styles.feature}>
                <FontAwesomeIcon icon={faCheckCircle} className={styles.featureIcon} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Usage Stats */}
        <div className={styles.usageStats}>
          <h4>Uso actual:</h4>
          <div className={styles.statItem}>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Publicaciones</span>
              <span className={styles.statValue}>
                {planData.publicationCount}/{currentTier.publicationLimit || '∞'}
              </span>
            </div>
            {currentTier.publicationLimit && (
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ 
                    width: `${Math.min((planData.publicationCount / currentTier.publicationLimit) * 100, 100)}%`,
                    backgroundColor: getTierColor(user.accountTier)
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      {user.accountTier !== 'free' && (
        <div className={styles.subscriptionDetails}>
          <h4>
            <FontAwesomeIcon icon={faCalendarAlt} />
            Detalles de la suscripción
          </h4>
          <div className={styles.subscriptionGrid}>
            <div className={styles.subscriptionItem}>
              <span className={styles.subscriptionLabel}>Fecha de inicio:</span>
              <span className={styles.subscriptionValue}>{formatDate(user.tierStartDate)}</span>
            </div>
            <div className={styles.subscriptionItem}>
              <span className={styles.subscriptionLabel}>Fecha de vencimiento:</span>
              <span className={styles.subscriptionValue}>{formatDate(user.tierEndDate)}</span>
            </div>
            <div className={styles.subscriptionItem}>
              <span className={styles.subscriptionLabel}>Estado:</span>
              <span className={`${styles.subscriptionValue} ${statusInfo.className}`}>
                {statusInfo.text}
              </span>
            </div>
            {user.subscriptionStatus === 'active' && user.tierEndDate && (
              <div className={styles.subscriptionItem}>
                <span className={styles.subscriptionLabel}>Días restantes:</span>
                <span className={styles.subscriptionValue}>
                  {getDaysRemaining(user.tierEndDate)} días
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment History */}
      {planData.paymentHistory && planData.paymentHistory.length > 0 && (
        <div className={styles.paymentHistory}>
          <h4>
            <FontAwesomeIcon icon={faHistory} />
            Historial de pagos
          </h4>
          <div className={styles.paymentsList}>
            {planData.paymentHistory.map((payment, index) => (
              <div key={index} className={styles.paymentItem}>
                <div className={styles.paymentInfo}>
                  <FontAwesomeIcon icon={faCreditCard} className={styles.paymentIcon} />
                  <div className={styles.paymentDetails}>
                    <span className={styles.paymentPlan}>Plan {formatTierName(payment.planId)}</span>
                    <span className={styles.paymentDate}>{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
                <div className={styles.paymentAmount}>
                  {formatPrice(payment.amount)}
                </div>
                <div className={`${styles.paymentStatus} ${
                  payment.status === 'active' ? styles.statusActive : styles.statusInactive
                }`}>
                  {payment.status === 'active' ? 'Pagado' : 'Inactivo'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          type="button"
          onClick={handleUpgradePlan}
          className={styles.upgradeButton}
          disabled={actionLoading}
        >
          <FontAwesomeIcon icon={faArrowUp} />
          {user.accountTier === 'free' ? 'Actualizar Plan' : 'Cambiar Plan'}
        </button>

        {user.accountTier !== 'free' && user.subscriptionStatus === 'active' && (
          <button
            type="button"
            onClick={handleCancelSubscription}
            disabled={actionLoading === 'cancel'}
            className={styles.cancelButton}
          >
            {actionLoading === 'cancel' ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Cancelando...
              </>
            ) : (
              'Cancelar Suscripción'
            )}
          </button>
        )}
      </div>
    </div>
  );
} 