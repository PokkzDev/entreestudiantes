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
  faChartLine,
  faClock,
  faRocket
} from "@fortawesome/free-solid-svg-icons";
import styles from "./PlanDetailsSection.module.css";
import { getTierColorSync, getTierBgColorSync, clearCache } from "@/lib/accountTiersClient";

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
    // Clear any cached tier data to ensure fresh data
    clearCache();
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
        setMessage(data.error || "Error al cargar los detalles del plan");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
      setMessage("Error al cargar los detalles del plan");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return null;
    
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { expired: true, text: 'Expirado' };
    }
    
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return { text: '1 día restante', urgent: true };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} días restantes`, urgent: true };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} días restantes`, warning: true };
    } else {
      return { text: `${diffDays} días restantes` };
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (user, currentSubscription) => {
    if (user.effectiveAccountTier === 'free' || user.accountTier === 'free') {
      return { text: 'Activo', className: styles.statusActive };
    }
    
    if (user.subscriptionStatus === 'active' && currentSubscription) {
      const timeRemaining = getTimeRemaining(currentSubscription.endDate);
      if (timeRemaining?.expired) {
        return { text: 'Expirado', className: styles.statusExpired };
      } else if (timeRemaining?.urgent) {
        return { text: timeRemaining.text, className: styles.statusUrgent };
      } else if (timeRemaining?.warning) {
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

  const handleRenewPlan = () => {
    router.push("/planes");
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Cargando información del plan...</p>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className={styles.errorContainer}>
        <p>Error al cargar la información del plan</p>
        <button onClick={fetchPlanDetails} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  const { user, currentSubscription, tierData, publicationCount, activePublicationCount, paymentHistory } = planData;
  const effectiveTier = user.effectiveAccountTier;
  const statusInfo = getStatusText(user, currentSubscription);
  const timeRemaining = currentSubscription ? getTimeRemaining(currentSubscription.endDate) : null;

  // Calculate premium investment data
  const premiumPayments = paymentHistory?.filter(payment => 
    payment.status === 'completed' && payment.planId !== 'free'
  ) || [];
  
  const totalPremiumInvestment = premiumPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const premiumPeriodsCount = premiumPayments.length;
  const totalPremiumDaysGained = premiumPeriodsCount * 30; // 30 days per premium purchase

  return (
    <div className={styles.container}>
      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      {/* Current Plan Header */}
      <div className={styles.currentPlanHeader}>
        <div className={styles.planInfo}>
          <div className={styles.planBadge} style={{
            backgroundColor: tierData ? getTierBgColorSync(effectiveTier) : '#f1f5f9',
            color: tierData ? getTierColorSync(effectiveTier) : '#64748b'
          }}>
            <FontAwesomeIcon icon={tierData ? (iconMap[tierData.icon] || faStar) : faStar} />
            {tierData ? tierData.name : effectiveTier}
          </div>
          <h3>Tu Plan Actual</h3>
        </div>
        <div className={`${styles.planStatus} ${statusInfo.className}`}>
          {statusInfo.text}
        </div>
      </div>

      {/* Plan Features */}
      {tierData && (
        <div className={styles.planFeatures}>
          <h4>Características de tu plan</h4>
          <div className={styles.featuresList}>
            {tierData.features.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <FontAwesomeIcon icon={faCheckCircle} className={styles.featureIcon} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Status Section */}
      {(effectiveTier !== 'free' || currentSubscription) && (
        <div className={styles.subscriptionDetails}>
          <h4>
            <FontAwesomeIcon icon={faCalendarAlt} />
            Estado de tu Plan Premium
          </h4>
          
          {currentSubscription && (
            <>
              <div className={styles.subscriptionGrid}>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Fecha de activación:</span>
                  <span className={styles.subscriptionValue}>{formatDate(currentSubscription.startDate)}</span>
                </div>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Fecha de expiración:</span>
                  <span className={styles.subscriptionValue}>{formatDate(currentSubscription.endDate)}</span>
                </div>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Estado:</span>
                  <span className={`${styles.subscriptionValue} ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                </div>
                {timeRemaining && (
                  <div className={styles.subscriptionItem}>
                    <span className={styles.subscriptionLabel}>Tiempo restante:</span>
                    <span className={`${styles.subscriptionValue} ${
                      timeRemaining.expired ? styles.statusExpired :
                      timeRemaining.urgent ? styles.statusUrgent :
                      timeRemaining.warning ? styles.statusWarning : ''
                    }`}>
                      <FontAwesomeIcon icon={faClock} />
                      {timeRemaining.text}
                    </span>
                  </div>
                )}
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>Monto pagado:</span>
                  <span className={styles.subscriptionValue}>
                    {formatPrice(currentSubscription.amount)}
                  </span>
                </div>
                <div className={styles.subscriptionItem}>
                  <span className={styles.subscriptionLabel}>ID de pago:</span>
                  <span className={styles.subscriptionValue}>
                    {currentSubscription.paymentId || 'N/A'}
                  </span>
                </div>
              </div>
              
              {/* Expiration Notice */}
              {!timeRemaining?.expired && (
                <div className={styles.expirationInfo}>
                  <div className={`${styles.expirationNotice} ${
                    timeRemaining?.urgent ? styles.urgent : 
                    timeRemaining?.warning ? styles.warning : ''
                  }`}>
                    <FontAwesomeIcon icon={
                      timeRemaining?.urgent ? faRocket : faCalendarAlt
                    } className={styles.expirationIcon} />
                    <div className={styles.expirationText}>
                      <strong>
                        {timeRemaining?.urgent ? '¡Tu plan expira pronto!' : 'Información de expiración:'}
                      </strong>
                      <p>
                        Tu plan premium expira el {formatDate(currentSubscription.endDate)}.
                        Después de esta fecha, tu cuenta volverá automáticamente al plan gratuito.
                      </p>
                      {timeRemaining?.urgent && (
                        <p className={styles.urgentMessage}>
                          ¡Renueva ahora para continuar disfrutando de todas las funciones premium sin interrupciones!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Expired Notice */}
              {timeRemaining?.expired && (
                <div className={styles.expiredInfo}>
                  <div className={styles.expiredNotice}>
                    <FontAwesomeIcon icon={faTimesCircle} className={styles.expiredIcon} />
                    <div className={styles.expiredText}>
                      <strong>Tu plan premium ha expirado</strong>
                      <p>
                        Tu cuenta ha vuelto al plan gratuito. Puedes renovar tu plan premium 
                        en cualquier momento para recuperar todas las funciones.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Payment History */}
      {paymentHistory && paymentHistory.length > 0 && (
        <div className={styles.paymentHistory}>
          <h4>
            <FontAwesomeIcon icon={faHistory} />
            Historial de pagos ({paymentHistory.length})
          </h4>
          <div className={styles.paymentsList}>
            {paymentHistory.map((payment, index) => (
              <div key={index} className={styles.paymentItem}>
                <div className={styles.paymentInfo}>
                  <FontAwesomeIcon icon={faCreditCard} className={styles.paymentIcon} />
                  <div className={styles.paymentDetails}>
                    <span className={styles.paymentPlan}>
                      Plan {payment.planId === 'free' ? 'Gratuito' : 
                            payment.planId === tierData?.tierKey ? tierData.name : 
                            payment.planId}
                    </span>
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
                  </div>
                </div>
                <div className={styles.paymentMeta}>
                  <div className={styles.paymentAmount}>
                    {formatPrice(payment.amount)}
                  </div>
                  <div className={`${styles.paymentStatus} ${
                    payment.status === 'completed' ? styles.statusActive : 
                    payment.subscription?.isExpired ? styles.statusExpired : styles.statusInactive
                  }`}>
                    {payment.status === 'completed' ? 'Completado' : 
                     payment.subscription?.isExpired ? 'Expirado' : payment.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Summary - Only show if user has premium history */}
      {premiumPeriodsCount > 0 && (
        <div className={styles.usageSummary}>
          <h4>
            <FontAwesomeIcon icon={faChartLine} />
            Tu Experiencia Premium
          </h4>
          <div className={styles.summaryGrid}>
            <div className={styles.premiumSummaryItem}>
              <div className={styles.summaryValue}>{formatPrice(totalPremiumInvestment)}</div>
              <div className={styles.summaryLabel}>Inversión premium</div>
            </div>
            <div className={styles.premiumSummaryItem}>
              <div className={styles.summaryValue}>{premiumPeriodsCount}</div>
              <div className={styles.summaryLabel}>Períodos premium</div>
            </div>
            <div className={styles.premiumSummaryItem}>
              <div className={styles.summaryValue}>{totalPremiumDaysGained}</div>
              <div className={styles.summaryLabel}>Días premium ganados</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        {effectiveTier === 'free' ? (
          <button
            type="button"
            onClick={handleUpgradePlan}
            className={styles.upgradeButton}
            disabled={actionLoading}
          >
            <FontAwesomeIcon icon={faRocket} />
            Obtener Plan Premium
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleUpgradePlan}
              className={styles.changeButton}
              disabled={actionLoading}
            >
              <FontAwesomeIcon icon={faArrowUp} />
              Cambiar Plan
            </button>
            
            {(timeRemaining?.urgent || timeRemaining?.warning || timeRemaining?.expired) && (
              <button
                type="button"
                onClick={handleRenewPlan}
                className={styles.renewButton}
                disabled={actionLoading}
              >
                <FontAwesomeIcon icon={faRocket} />
                {timeRemaining?.expired ? 'Renovar Plan Premium' : 'Renovar Ahora'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
} 