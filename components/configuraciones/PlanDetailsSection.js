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
  faHistory,
  faChartLine
} from "@fortawesome/free-solid-svg-icons";
import { ACCOUNT_TIERS, formatTierName, getTierColor, getTierBgColor, getTierIcon } from "@/lib/accountTiers";
import SubscriptionCancelModal from "../SubscriptionCancelModal";
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
  const [showCancelModal, setShowCancelModal] = useState(false);
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

  const getTimeRemaining = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    
    if (diffTime <= 0) {
      return { expired: true, text: "Expirado" };
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 1) {
      return { expired: false, text: `${diffDays} días restantes` };
    } else if (diffHours > 1) {
      return { expired: false, text: `${diffHours} horas restantes` };
    } else {
      return { expired: false, text: "Menos de 1 hora restante" };
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getStatusText = (user, currentSubscription) => {
    if (user.effectiveAccountTier === 'free' || user.accountTier === 'free') {
      return { text: 'Activo', className: styles.statusActive };
    }
    
    if (user.subscriptionStatus === 'active' && currentSubscription) {
      const timeRemaining = getTimeRemaining(currentSubscription.endDate);
      if (timeRemaining?.expired) {
        return { text: 'Expirado', className: styles.statusExpired };
      } else if (timeRemaining?.text.includes('restantes')) {
        return { text: timeRemaining.text, className: styles.statusWarning };
      } else {
        return { text: 'Activo', className: styles.statusActive };
      }
    }
    
    return { text: 'Inactivo', className: styles.statusInactive };
  };

  const handleUpgradePlan = () => {
    router.push("/planes");
  };

  const handleCancelSubscription = async (reason) => {
    setActionLoading('cancel');
    setShowCancelModal(false);
    
    try {
      const response = await fetch("/api/configuraciones/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          reason: reason || "Sin razón especificada"
        }),
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

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
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

  const { user, currentSubscription } = planData;
  // Use effective tier for UI display (considers active subscription)
  const effectiveTier = user.effectiveAccountTier || user.accountTier;
  const currentTier = ACCOUNT_TIERS[effectiveTier];
  const statusInfo = getStatusText(user, currentSubscription);

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
          <div className={styles.planIcon} style={{ color: getTierColor(effectiveTier) }}>
            {getTierIconComponent(effectiveTier)}
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
                    backgroundColor: getTierColor(effectiveTier)
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      {(effectiveTier !== 'free' || currentSubscription) && (
        <div className={styles.subscriptionDetails}>
          <h4>
            <FontAwesomeIcon icon={faCalendarAlt} />
            Detalles de la suscripción
          </h4>
          <div className={styles.subscriptionGrid}>
            {currentSubscription && (
              <>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Fecha de inicio:</span>
                  <span className={styles.subscriptionValue}>{formatDate(currentSubscription.startDate)}</span>
                </div>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Fecha de vencimiento:</span>
                  <span className={styles.subscriptionValue}>{formatDate(currentSubscription.endDate)}</span>
                </div>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Estado:</span>
                  <span className={`${styles.subscriptionValue} ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                </div>
                {user.subscriptionStatus === 'active' && currentSubscription.endDate && (
                  <div className={styles.subscriptionItem}>
                    <span className={styles.subscriptionLabel}>Tiempo restante:</span>
                    <span className={styles.subscriptionValue}>
                      {getTimeRemaining(currentSubscription.endDate)?.text || 'N/A'}
                    </span>
                  </div>
                )}
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Renovación automática:</span>
                  <span className={styles.subscriptionValue}>
                    {currentSubscription.autoRenew ? (
                      <span className={styles.autoRenewEnabled}>
                        <FontAwesomeIcon icon={faCheckCircle} /> Activada
                      </span>
                    ) : (
                      <span className={styles.autoRenewDisabled}>
                        <FontAwesomeIcon icon={faTimesCircle} /> Manual
                      </span>
                    )}
                  </span>
                </div>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>ID de pago:</span>
                  <span className={styles.subscriptionValue}>
                    {currentSubscription.paymentId || 'N/A'}
                  </span>
                </div>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Monto pagado:</span>
                  <span className={styles.subscriptionValue}>
                    {formatPrice(currentSubscription.amount)}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* Renewal Information */}
          {user.subscriptionStatus === 'active' && currentSubscription && !getTimeRemaining(currentSubscription.endDate)?.expired && (
            <div className={styles.renewalInfo}>
              <div className={styles.renewalNotice}>
                <FontAwesomeIcon icon={faCalendarAlt} className={styles.renewalIcon} />
                <div className={styles.renewalText}>
                  <strong>Próxima renovación:</strong>
                  <p>
                    Tu plan expira el {formatDate(currentSubscription.endDate)}. 
                    {currentSubscription.autoRenew ? (
                      " Se renovará automáticamente."
                    ) : (
                      " Deberás renovar manualmente para continuar."
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unified Payment History - Shows payments with subscription context */}
      {planData.paymentHistory && planData.paymentHistory.length > 0 && (
        <div className={styles.paymentHistory}>
          <h4>
            <FontAwesomeIcon icon={faHistory} />
            Historial de pagos y suscripciones ({planData.paymentHistory.length})
          </h4>
          <div className={styles.paymentsList}>
            {planData.paymentHistory.map((payment, index) => (
              <div key={index} className={styles.paymentItem}>
                <div className={styles.paymentInfo}>
                  <FontAwesomeIcon icon={faCreditCard} className={styles.paymentIcon} />
                  <div className={styles.paymentDetails}>
                    <span className={styles.paymentPlan}>Plan {formatTierName(payment.planId)}</span>
                    <span className={styles.paymentDate}>
                      Pagado: {formatDateTime(payment.paymentDate || payment.createdAt)}
                    </span>
                    {payment.subscription && (
                      <span className={styles.paymentPeriod}>
                        Período: {formatDate(payment.subscription.startDate)} - {formatDate(payment.subscription.endDate)}
                      </span>
                    )}
                    {payment.paymentId && (
                      <span className={styles.paymentId}>
                        ID: {payment.paymentId}
                      </span>
                    )}
                    {payment.subscription?.cancelReason && (
                      <span className={styles.cancelReason}>
                        Razón de cancelación: {payment.subscription.cancelReason}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.paymentMeta}>
                  <div className={styles.paymentAmount}>
                    {formatPrice(payment.amount)} {/* Amount is already in CLP, not cents */}
                  </div>
                  <div className={`${styles.paymentStatus} ${
                    payment.status === 'completed' ? styles.statusActive : 
                    payment.subscription?.subscriptionStatus === 'cancelled' ? styles.statusCancelled : 
                    payment.subscription?.isExpired ? styles.statusExpired : styles.statusInactive
                  }`}>
                    {payment.status === 'completed' ? 'Completado' : 
                     payment.subscription?.subscriptionStatus === 'cancelled' ? 'Cancelado' :
                     payment.subscription?.isExpired ? 'Expirado' : payment.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Summary */}
      <div className={styles.accountSummary}>
        <h4>
          <FontAwesomeIcon icon={faChartLine} />
          Resumen de cuenta
        </h4>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {planData.paymentHistory ? planData.paymentHistory.length : 0}
            </div>
            <div className={styles.summaryLabel}>Total de pagos</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {formatPrice(
                planData.paymentHistory ? 
                planData.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0) : 0
              )}
            </div>
            <div className={styles.summaryLabel}>Total gastado</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {planData.publicationCount}
            </div>
            <div className={styles.summaryLabel}>Publicaciones activas</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryValue}>
              {effectiveTier === 'free' ? 
                'Gratis' : 
                user.subscriptionStatus === 'active' ? 
                  formatTierName(effectiveTier) : 'Inactivo'
              }
            </div>
            <div className={styles.summaryLabel}>Estado actual</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          type="button"
          onClick={handleUpgradePlan}
          className={styles.upgradeButton}
          disabled={actionLoading}
        >
          <FontAwesomeIcon icon={faArrowUp} />
          {effectiveTier === 'free' ? 'Actualizar Plan' : 'Cambiar Plan'}
        </button>

        {effectiveTier !== 'free' && user.subscriptionStatus === 'active' && currentSubscription && (
          <button
            type="button"
            onClick={handleCancelClick}
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

      {showCancelModal && (
        <SubscriptionCancelModal
          isOpen={showCancelModal}
          onConfirm={handleCancelSubscription}
          onClose={handleCancelModalClose}
          userTier={effectiveTier}
        />
      )}
    </div>
  );
} 