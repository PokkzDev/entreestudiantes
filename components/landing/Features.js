import { FaBullhorn, FaUsers, FaShieldAlt } from 'react-icons/fa';
import styles from './landing.module.css';

export default function Features() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Una Plataforma Pensada para Ti</h2>
          <p className={styles.sectionSubtitle}>
            Todo lo que necesitas para una experiencia de compra y venta segura y eficiente entre compañeros.
          </p>
        </div>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FaBullhorn />
            </div>
            <h3 className={styles.featureTitle}>Publica Fácilmente</h3>
            <p className={styles.featureText}>
              Crea anuncios atractivos para tus productos o servicios en minutos y llega a toda tu comunidad.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FaUsers />
            </div>
            <h3 className={styles.featureTitle}>Conecta Directo</h3>
            <p className={styles.featureText}>
              Comunícate directamente con otros estudiantes sin intermediarios, de forma rápida y segura.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FaShieldAlt />
            </div>
            <h3 className={styles.featureTitle}>Comunidad Segura</h3>
            <p className={styles.featureText}>
              Verificamos a los usuarios para asegurar un entorno de confianza y proteger a nuestra comunidad.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
