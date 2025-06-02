"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
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

// Loading component for Suspense fallback
function PlanesLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Elige tu Plan</h1>
        <p className={styles.subtitle}>
          Encuentra el plan perfecto para tus necesidades y comienza a publicar más contenido
        </p>
        
        {/* Payment Model Warning */}
        <div className={styles.paymentNotice}>
          <div className={styles.noticeIcon}>ℹ️</div>
          <div className={styles.noticeContent}>
            <strong>Información sobre los planes:</strong> Los planes tienen una duración de 30 días. 
            Al finalizar este período, podrás renovar fácilmente tu plan para continuar disfrutando de los beneficios.
          </div>
        </div>
      </div>
      
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando planes disponibles...</p>
      </div>
    </div>
  );
}

function PlanesContent() {
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // Track which plan is being processed
  const [message, setMessage] = useState(null);
  const [messageTimeoutId, setMessageTimeoutId] = useState(null);
  const [planPurchasingEnabled, setPlanPurchasingEnabled] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchAccountInfo = useCallback(async () => {
    if (!session) return;
    
    try {
      const response = await fetch('/api/check-publication-limits');
      const data = await response.json();
      
      if (data.success) {
        setAccountInfo({
          currentTier: data.currentTier,
          tierName: data.tierName,
          currentCount: data.currentCount,
          limit: data.limit,
          remaining: data.remaining,
          isUnlimited: data.isUnlimited,
          canCreate: data.canCreate,
          subscriptionActive: data.subscriptionActive
        });
      } else {
        console.error('Error fetching account info:', data.error);
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const checkPlanPurchasingStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/plan-purchasing-status');
      const data = await response.json();
      
      if (data.success) {
        setPlanPurchasingEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error checking plan purchasing status:', error);
      // Default to enabled if check fails
      setPlanPurchasingEnabled(true);
    }
  }, []);

  const handlePaymentSuccess = useCallback(async (token) => {
    try {
      const response = await fetch('/api/flow/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (data.success && data.subscriptionUpdated) {
        setMessageWithTimeout({
          type: 'success',
          text: '¡Pago confirmado! Tu plan ha sido actualizado exitosamente.'
        });
        // Refresh account info immediately
        fetchAccountInfo();
      } else if (data.success === false) {
        // Payment verification failed - this means the payment was not approved
        console.log('❌ Payment verification failed:', data);
        setMessageWithTimeout({
          type: 'error',
          text: data.detailedError || data.error || 'El pago no fue aprobado. Por favor, intenta nuevamente.'
        });
      } else {
        // Unexpected response format
        setMessageWithTimeout({
          type: 'warning',
          text: 'Pago recibido. La actualización del plan puede tomar unos minutos.'
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setMessageWithTimeout({
        type: 'error',
        text: 'Error al verificar el pago. Por favor, verifica el estado de tu transacción.'
      });
    }
  }, [fetchAccountInfo]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccountInfo();
      checkPlanPurchasingStatus();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, fetchAccountInfo, checkPlanPurchasingStatus]);

  useEffect(() => {
    if (!searchParams) {
      console.log('⚠️ searchParams is null/undefined, skipping processing');
      return;
    }

    // Check for Flow.cl payment status in URL params with null safety
    let token, flowStatus, errorParam, messageParam, flowReturn;
    
    try {
      token = searchParams.get('token');
      flowStatus = searchParams.get('status');
      errorParam = searchParams.get('error');
      messageParam = searchParams.get('message');
      flowReturn = searchParams.get('flow_return');
    } catch (searchParamsError) {
      console.error('❌ Error getting search params:', searchParamsError);
      return;
    }
    
    // Log for debugging with null safety
    console.log('🔍 URL params detected:', { 
      token: token || 'null', 
      flowStatus: flowStatus || 'null', 
      errorParam: errorParam || 'null', 
      messageParam: messageParam || 'null', 
      flowReturn: flowReturn || 'null' 
    });
    
    // Safe URL logging that won't cause errors
    try {
      if (typeof window !== 'undefined' && window.location && window.location.href) {
        console.log('🌐 Current URL:', window.location.href);
      } else {
        console.log('🌐 Current URL: Not available (SSR or window undefined)');
      }
    } catch (urlError) {
      console.error('❌ Error getting current URL:', urlError);
      console.log('🌐 Current URL: Error accessing window.location');
    }
    
    // Handle general error parameter (from redirect failures, etc.)
    if (errorParam) {
      let errorMessage = 'Hubo un problema con el procesamiento. Por favor, intenta nuevamente.';
      
      switch (errorParam) {
        case 'redirect_failed':
          errorMessage = 'Hubo un problema con el redirect después del pago. Por favor, verifica el estado de tu pago.';
          break;
        default:
          if (messageParam === 'flow_return_error') {
            errorMessage = 'Hubo un problema procesando la respuesta de Flow.cl. Por favor, verifica tu pago en tu banco o intenta nuevamente.';
          }
      }
      
      setMessageWithTimeout({
        type: 'error',
        text: errorMessage
      });
      
      return; // Don't process other parameters if there's an error
    }
    
    // Handle Flow.cl returns - both with and without tokens
    if (flowStatus || flowReturn) {
      console.log('🔄 Processing Flow.cl response');
      
      switch (flowStatus) {
        case 'success':
          if (token && token !== 'null' && token !== 'undefined') {
            console.log('✅ Payment success with token - verifying payment');
            // Payment was approved with token, call endpoint to verify and update subscription
            handlePaymentSuccess(token);
          } else {
            console.log('✅ Payment success without token - Flow.cl scenario');
            // Success without token - common in Flow.cl sandbox or certain payment methods
            setMessageWithTimeout({
              type: 'success',
              text: '¡Pago completado! Tu plan será actualizado en breve. Si no ves los cambios en unos minutos, contacta al soporte.'
            });
            
            // Still try to refresh account info in case the webhook already processed it
            setTimeout(() => {
              fetchAccountInfo();
            }, 2000);
          }
          break;
          
        case 'cancelled':
          setMessageWithTimeout({
            type: 'warning',
            text: 'El pago fue cancelado. Puedes intentar nuevamente cuando desees.'
          });
          break;
          
        case 'failed':
          setMessageWithTimeout({
            type: 'error',
            text: 'Hubo un problema con el pago. Por favor, intenta nuevamente.'
          });
          break;
          
        case 'error':
          setMessageWithTimeout({
            type: 'error',
            text: 'Se produjo un error durante el proceso de pago. Por favor, verifica el estado de tu transacción.'
          });
          break;
          
        case 'unknown':
          if (token && token !== 'null' && token !== 'undefined') {
            console.log('🔍 Unknown status with token - verifying payment status');
            // Call verification endpoint to determine the actual payment status
            handlePaymentSuccess(token);
          } else {
            console.log('⚠️ Unknown status without token');
            setMessageWithTimeout({
              type: 'warning',
              text: 'El estado del pago no pudo ser determinado. Por favor, verifica el estado de tu transacción en tu banco.'
            });
          }
          break;
          
        default:
          console.warn('⚠️ Unknown Flow.cl status:', flowStatus);
          setMessageWithTimeout({
            type: 'warning',
            text: 'Estado de pago desconocido. Por favor, verifica el estado de tu transacción.'
          });
      }
      
    } else if (token || flowStatus) {
      // Handle edge cases with invalid parameters
      console.warn('⚠️ Invalid Flow.cl parameters detected:', { token, flowStatus });
      // Removed URL cleanup for invalid parameters
    }
  }, [searchParams, session, router, handlePaymentSuccess, fetchAccountInfo]);

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

    // Check if plan purchasing is disabled
    if (!planPurchasingEnabled) {
      setMessageWithTimeout({
        type: 'warning',
        text: 'La compra de planes está temporalmente deshabilitada. Intenta más tarde.'
      });
      return;
    }

    // Check if user is already on this plan or higher
    if (isCurrentPlan(tierKey) || !isUpgrade(tierKey)) {
      return;
    }

    setProcessing(tierKey);
    
    try {
      // Create Flow.cl payment
      const response = await fetch('/api/flow/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: tierKey }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to Flow.cl payment page with validation
        if (!data.url || !data.token) {
          throw new Error('Flow.cl response missing URL or token');
        }
        
        // Ensure the URL and token are not null or undefined strings
        const urlValue = data.url;
        const tokenValue = data.token;
        
        if (urlValue === 'null' || urlValue === 'undefined' || !urlValue.trim()) {
          throw new Error('Flow.cl returned invalid URL');
        }
        
        if (tokenValue === 'null' || tokenValue === 'undefined' || !tokenValue.trim()) {
          throw new Error('Flow.cl returned invalid token');
        }
        
        const redirectUrl = urlValue + "?token=" + tokenValue;
        console.log('Flow.cl redirect data:', { url: urlValue, token: tokenValue?.substring(0, 10) + '...' });
        console.log('Redirecting to Flow.cl:', redirectUrl);
        
        // Validate the URL before redirecting
        try {
          new URL(redirectUrl); // This will throw if invalid
          window.location.href = redirectUrl;
        } catch (urlError) {
          console.error('Invalid redirect URL:', redirectUrl, urlError);
          throw new Error('URL de redirección inválida recibida de Flow.cl');
        }
      } else {
        throw new Error(data.error || 'Error al crear el pago en Flow.cl');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setMessageWithTimeout({
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

  const clearMessageTimeout = () => {
    if (messageTimeoutId) {
      clearTimeout(messageTimeoutId);
      setMessageTimeoutId(null);
    }
  };

  const setMessageWithTimeout = (newMessage) => {
    clearMessageTimeout(); // Clear any existing timeout
    setMessage(newMessage);
    
    // Set new timeout based on message type
    const timeoutDuration = newMessage?.type === 'success' ? 10000 : 15000;
    const timeoutId = setTimeout(() => {
      setMessage(null);
      setMessageTimeoutId(null);
    }, timeoutDuration);
    
    setMessageTimeoutId(timeoutId);
  };

  const dismissMessage = () => {
    clearMessageTimeout();
    setMessage(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearMessageTimeout();
    };
  }, [messageTimeoutId]);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Elige tu Plan</h1>
        <p className={styles.subtitle}>
          Encuentra el plan perfecto para tus necesidades y comienza a publicar más contenido
        </p>
        
        {/* Payment Model Warning */}
        <div className={styles.paymentNotice}>
          <div className={styles.noticeIcon}>ℹ️</div>
          <div className={styles.noticeContent}>
            <strong>Información sobre los planes:</strong> Los planes tienen una duración de 30 días. 
            Al finalizar este período, podrás renovar fácilmente tu plan para continuar disfrutando de los beneficios.
          </div>
        </div>
        
        {/* Plan Purchasing Disabled Notice */}
        {!planPurchasingEnabled && (
          <div className={styles.disabledNotice}>
            <div className={styles.noticeIcon}>⚠️</div>
            <div className={styles.noticeContent}>
              <strong>Compras temporalmente deshabilitadas:</strong> La funcionalidad de compra de planes está temporalmente deshabilitada para mantenimiento.
            </div>
          </div>
        )}
        
        {message && (
          <div className={`${styles.messageAlert} ${styles[message.type]}`}>
            <div className={styles.messageContent}>
              <p>{message.text}</p>
              <button 
                className={styles.dismissButton}
                onClick={dismissMessage}
                aria-label="Cerrar mensaje"
              >
                ×
              </button>
            </div>
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
                  {tier.price > 0 && (
                    <div className={styles.priceDetails}>
                      <span className={styles.period}>pago único mensual</span>
                      <span className={styles.renewalNote}>Renovable cada 30 días</span>
                    </div>
                  )}
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
                disabled={isCurrentPlan(tierKey) || processing === tierKey || (!planPurchasingEnabled && tierKey !== 'free')}
                className={`${styles.selectButton} ${isCurrentPlan(tierKey) ? styles.currentButton : isUpgrade(tierKey) ? styles.upgradeButton : styles.downgradeButton}`}
                style={!isCurrentPlan(tierKey) ? { 
                  backgroundColor: getTierColor(tierKey),
                  borderColor: getTierColor(tierKey),
                  color: 'white',
                  opacity: (!planPurchasingEnabled && tierKey !== 'free') ? 0.6 : 1
                } : {}}
              >
                {processing === tierKey ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span style={{ marginLeft: '8px' }}>Procesando...</span>
                  </>
                ) : isCurrentPlan(tierKey) ? (
                  'Plan Actual'
                ) : !planPurchasingEnabled && tierKey !== 'free' ? (
                  'Compras temporalmente deshabilitadas'
                ) : tierKey === 'free' ? (
                  'Plan Gratuito'
                ) : isUpgrade(tierKey) ? (
                  `Pagar ${formatPrice(tier.price)} por ${tier.name}`
                ) : (
                  `Pagar ${formatPrice(tier.price)} por ${tier.name}`
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Planes() {
  return (
    <Suspense fallback={<PlanesLoading />}>
      <PlanesContent />
    </Suspense>
  );
}