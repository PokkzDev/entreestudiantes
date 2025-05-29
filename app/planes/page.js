"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandHoldingHeart, faStar, faGem, faCrown } from "@fortawesome/free-solid-svg-icons";
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
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccountInfo();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

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

  const handleSelectPlan = (tierKey) => {
    if (!session) {
      router.push("/login?redirect=/planes");
      return;
    }

    if (tierKey === "free") {
      // Free plan - no action needed
      return;
    }

    // For now, just show an alert. In a real app, this would integrate with payment system
    alert(`Próximamente: Integración con sistema de pagos para el plan ${formatTierName(tierKey)}`);
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

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Elige tu Plan</h1>
        <p className={styles.subtitle}>
          Encuentra el plan perfecto para tus necesidades y comienza a publicar más contenido
        </p>
        
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
                disabled={isCurrentPlan(tierKey)}
                className={`${styles.selectButton} ${isCurrentPlan(tierKey) ? styles.currentButton : isUpgrade(tierKey) ? styles.upgradeButton : styles.downgradeButton}`}
                style={!isCurrentPlan(tierKey) ? { 
                  backgroundColor: getTierColor(tierKey),
                  borderColor: getTierColor(tierKey),
                  color: 'white'
                } : {}}
              >
                {isCurrentPlan(tierKey) 
                  ? 'Plan Actual' 
                  : isUpgrade(tierKey) 
                    ? `Actualizar a ${tier.name}`
                    : `Cambiar a ${tier.name}`
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 