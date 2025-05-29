import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandHoldingHeart, faStar, faGem, faCrown } from "@fortawesome/free-solid-svg-icons";
import { getTierIcon, getTierColor, getTierBgColor, formatTierName } from '@/lib/accountTiers';
import styles from './AccountTierBadge.module.css';

// Icon mapping for FontAwesome
const iconMap = {
  "hand-holding-heart": faHandHoldingHeart,
  "star": faStar,
  "gem": faGem,
  "crown": faCrown
};

const AccountTierBadge = ({ tier, size = 'medium', showText = true }) => {
  const tierColor = getTierColor(tier);
  const tierBgColor = getTierBgColor(tier);
  const tierName = formatTierName(tier);
  const iconName = getTierIcon(tier);
  const icon = iconMap[iconName];

  const sizeClasses = {
    small: {
      padding: '0.25rem 0.5rem',
      fontSize: '0.75rem',
      iconSize: '0.875rem'
    },
    medium: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      iconSize: '1rem'
    },
    large: {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      iconSize: '1.25rem'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.medium;

  const badgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: showText ? '0.5rem' : '0',
    backgroundColor: tierBgColor,
    color: tierColor,
    border: `2px solid ${tierColor}`,
    borderRadius: '20px',
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    fontWeight: '600',
    lineHeight: '1',
    whiteSpace: 'nowrap'
  };

  const iconStyles = {
    fontSize: currentSize.iconSize,
    color: tierColor
  };

  return (
    <span style={badgeStyles}>
      {icon && <FontAwesomeIcon icon={icon} style={iconStyles} />}
      {showText && <span>{tierName}</span>}
    </span>
  );
};

export default AccountTierBadge; 