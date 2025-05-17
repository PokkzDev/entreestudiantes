import React from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';

export default function StepConfirmar({ form, imagePreviews, styles, formatNumber, getCategoryLabel }) {
  return (
    <div className={styles.publicacionReview}>
      <h3 className={styles.reviewTitle}>Así se verá tu publicación</h3>
      <div className={styles.publicacionCard}>
        <div className={styles.publicacionCardHeader}>
          <div className={styles.publicacionCategoryBadge}>
            {getCategoryLabel(form.category)}
          </div>
          <div className={styles.publicacionType}>
            {form.type === 'servicio' ? '🛠️ Servicio' : '📦 Producto'}
          </div>
        </div>
        <h2 className={styles.publicacionTitle}>{form.title}</h2>
        <p className={styles.publicacionDescription}>{form.description}</p>
        <div className={styles.publicacionDetails}>
          {(form.type === "producto" || form.type === "servicio") && (
            <div className={styles.publicacionPrice}>
              <span className={styles.priceLabel}>Precio:</span>
              <span className={styles.priceValue}>
                {form.type === 'producto' && form.priceRange
                  ? `$${formatNumber(form.priceMin)} a $${formatNumber(form.priceMax)}`
                  : `$${formatNumber(form.priceMin)}`
                }
              </span>
            </div>
          )}
          <div className={styles.publicacionContact}>
            <span className={styles.contactLabel}>Contacto:</span>
            <span className={styles.contactValue}>
              {form.contactMethod === 'whatsapp' && '📱 WhatsApp: '}
              {form.contactMethod === 'email' && '📧 Email: '}
              {form.contactMethod === 'telefono' && '☎️ Teléfono: '}
              {form.contactMethod === 'otro' && '🔗 Contacto: '}
              {form.contactInfo}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {form.images && form.images.length > 0 && form.images.map((img, idx) => (
            typeof img === 'string' && img.includes('cloudinary') ? (
              <CldImage
                key={idx}
                src={img.split('/').slice(-1)[0].split('.')[0]}
                width={80}
                height={80}
                alt="imagen"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                crop={{ type: 'auto', source: true }}
              />
            ) : (
              <Image key={idx} src={typeof img === 'string' ? img : imagePreviews[idx]} alt="imagen" width={80} height={80} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} />
            )
          ))}
        </div>
      </div>
    </div>
  );
}
