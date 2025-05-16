import React from "react";
import styles from "./PersonalInfoSection.module.css";

export default function PersonalInfoSection({ session }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Información personal
      </h2>
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <div className={styles.infoLabel}>Nombre</div>
          <div className={styles.infoValue}>{session?.user?.name || "No disponible"}</div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.infoLabel}>Email</div>
          <div className={styles.infoValue}>{session?.user?.email || "No disponible"}</div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.infoLabel}>Nombre de usuario</div>
          <div className={styles.infoValue}>
            <span>{session?.user?.username || "No disponible"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
