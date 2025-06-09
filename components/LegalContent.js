"use client";

import styles from "./LegalContent.module.css";

export default function LegalContent({ document, isModal = false }) {
  if (!document) return null;

  return (
    <div className={`${styles.content} ${isModal ? styles.modalContent : styles.pageContent}`}>
      <h2 className={styles.legalTitle}>
        {document.title}
      </h2>
      <p className={styles.legalDate}>
        Fecha de última actualización: {document.lastUpdated}
      </p>

      <div className={styles.legalSectionContainer}>
        {document.sections.map((section, index) => (
          <div key={index} className={styles.legalSection}>
            <h3 className={styles.legalSectionTitle}>
              {section.title}
            </h3>
            <div className={styles.legalParagraph}>
              {section.content}
              {section.list && (
                <ul>
                  {section.list.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
              {section.footer && (
                <p>{section.footer}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 