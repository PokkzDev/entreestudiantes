"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandHoldingHeart, faStar, faGem, faCrown, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { ACCOUNT_TIERS, getTierColor, getTierIcon, getTierBgColor, formatTierName } from "@/lib/accountTiers";
import styles from "./page.module.css";

// Icon mapping for FontAwesome
const iconMap = {
  "hand-holding-heart": faHandHoldingHeart,
  "star": faStar,
  "gem": faGem,
  "crown": faCrown
};

export default function Planes() {
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // Track which plan is being processed
  const [message, setMessage] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccountInfo();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    // Check for payment status in URL params
    const paymentStatus = searchParams.get('payment');
    const paymentId = searchParams.get('payment_id');
    const collectionStatus = searchParams.get('collection_status');
    
    if (paymentStatus) {
      switch (paymentStatus) {
        case 'success':
          if (collectionStatus === 'approved' && paymentId) {
            // Payment was approved, call endpoint to verify and update subscription
            handlePaymentSuccess(paymentId);
          } else {
            setMessage({
              type: 'success',
              text: '¡Pago procesado exitosamente! Tu plan ha sido actualizado.'
            });
          }
          // Refresh account info after successful payment
          if (session) {
            setTimeout(() => {
              fetchAccountInfo();
            }, 2000);
          }
          break;
        case 'error':
          setMessage({
            type: 'error',
            text: 'Hubo un problema con el pago. Por favor, intenta nuevamente.'
          });
          break;
        case 'pending':
          setMessage({
            type: 'warning',
            text: 'Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.'
          });
          break;
      }
      
      // Clear URL params after showing message
      setTimeout(() => {
        router.replace('/planes');
        setMessage(null);
      }, 5000);
    }
  }, [searchParams, session, router]);

  async function fetchAccountInfo() {
    try {
      const res = await fetch("/api/check-publication-limits");
      const data = await res.json();
      
      if (data.success) {
        setAccountInfo(data);
      }
    } catch (error) {
      console.error("Error al cargar información de cuenta:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatPrice = (price) => {
    if (price === 0) return "Gratis";
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSelectPlan = async (tierKey) => {
    if (!session) {
      router.push("/login?redirect=/planes");
      return;
    }

    if (tierKey === "free") {
      // Free plan - no action needed
      return;
    }

    // Check if user is already on this plan or higher
    if (isCurrentPlan(tierKey) || !isUpgrade(tierKey)) {
      return;
    }

    setProcessing(tierKey);
    
    try {
      // Create payment preference
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: tierKey }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to MercadoPago Checkout Pro
        const checkoutUrl = process.env.NODE_ENV === 'development' 
          ? data.preference.sandbox_init_point 
          : data.preference.init_point;
        
        window.location.href = checkoutUrl;
      } else {
        throw new Error(data.error || 'Error al crear la preferencia de pago');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Error al procesar el pago. Por favor, intenta nuevamente.'
      });
      setProcessing(null);
    }
  };

  const isCurrentPlan = (tierKey) => {
    return accountInfo?.currentTier === tierKey;
  };

  const isUpgrade = (tierKey) => {
    if (!accountInfo) return false;
    const tierOrder = { free: 0, basic: 1, premium: 2, elite: 3 };
    return tierOrder[tierKey] > tierOrder[accountInfo.currentTier];
  };

  const getTierIconComponent = (tierKey) => {
    const iconName = getTierIcon(tierKey);
    const icon = iconMap[iconName];
    return icon ? <FontAwesomeIcon icon={icon} /> : null;
  };

  const handlePaymentSuccess = async (paymentId) => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      });
      
      const data = await response.json();
      
      if (data.success && data.subscriptionUpdated) {
        setMessage({
          type: 'success',
          text: '¡Pago confirmado! Tu plan ha sido actualizado exitosamente.'
        });
        // Refresh account info immediately
        fetchAccountInfo();
      } else {
        setMessage({
          type: 'warning',
          text: 'Pago recibido. La actualización del plan puede tomar unos minutos.'
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setMessage({
        type: 'warning',
        text: 'Pago recibido. La actualización del plan puede tomar unos minutos.'
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Elige tu Plan</h1>
        <p className={styles.subtitle}>
          Encuentra el plan perfecto para tus necesidades y comienza a publicar más contenido
        </p>
        
        {message && (
          <div className={`${styles.messageAlert} ${styles[message.type]}`}>
            <p>{message.text}</p>
          </div>
        )}
        
        {accountInfo && (
          <div className={styles.currentPlanBadge}>
            <span className={styles.currentPlanIcon}>
              {getTierIconComponent(accountInfo.currentTier)}
            </span>
            <span>Plan actual: <strong>{accountInfo.tierName}</strong></span>
            <span className={styles.currentStats}>
              ({accountInfo.currentCount}/{accountInfo.limit || '∞'} publicaciones)
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando planes disponibles...</p>
        </div>
      ) : (
        <div className={styles.plansGrid}>
          {Object.entries(ACCOUNT_TIERS)
            .filter(([tierKey]) => tierKey !== 'elite' && tierKey !== 'premium') // Remove elite and premium tiers
            .map(([tierKey, tier]) => (
            <div 
              key={tierKey}
              className={`${styles.planCard} ${isCurrentPlan(tierKey) ? styles.currentPlan : ''}`}
              style={{ 
                borderColor: getTierColor(tierKey),
                backgroundColor: isCurrentPlan(tierKey) ? getTierBgColor(tierKey) : 'white'
              }}
            >
              {isCurrentPlan(tierKey) && (
                <div className={styles.currentBadge}>
                  <span>✓ Plan Actual</span>
                </div>
              )}

              <div className={styles.planHeader}>
                <div className={styles.planIcon} style={{ color: getTierColor(tierKey) }}>
                  {getTierIconComponent(tierKey)}
                </div>
                <h3 className={styles.planName}>{tier.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.price}>{formatPrice(tier.price)}</span>
                  {tier.price > 0 && <span className={styles.period}>/mes</span>}
                </div>
              </div>

              <div className={styles.planLimits}>
                <div className={styles.limitItem}>
                  <span className={styles.limitNumber}>
                    {tier.publicationLimit || '∞'}
                  </span>
                  <span className={styles.limitText}>
                    {tier.publicationLimit ? 'publicaciones' : 'publicaciones ilimitadas'}
                  </span>
                </div>
              </div>

              <ul className={styles.featuresList}>
                {tier.features.map((feature, index) => (
                  <li key={index} className={styles.feature}>
                    <span className={styles.checkIcon}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(tierKey)}
                disabled={isCurrentPlan(tierKey) || processing === tierKey}
                className={`${styles.selectButton} ${isCurrentPlan(tierKey) ? styles.currentButton : isUpgrade(tierKey) ? styles.upgradeButton : styles.downgradeButton}`}
                style={!isCurrentPlan(tierKey) ? { 
                  backgroundColor: getTierColor(tierKey),
                  borderColor: getTierColor(tierKey),
                  color: 'white'
                } : {}}
              >
                {processing === tierKey ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span style={{ marginLeft: '8px' }}>Procesando...</span>
                  </>
                ) : isCurrentPlan(tierKey) ? (
                  'Plan Actual'
                ) : isUpgrade(tierKey) ? (
                  `Actualizar a ${tier.name}`
                ) : (
                  `Cambiar a ${tier.name}`
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 