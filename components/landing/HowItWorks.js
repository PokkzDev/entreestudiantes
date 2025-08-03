import styles from './landing.module.css';

export default function HowItWorks() {
  return (
    <section className={styles.howItWorks}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Empezar es Muy Sencillo</h2>
          <p className={styles.sectionSubtitle}>
            Sigue estos simples pasos para unirte a nuestra comunidad y empezar a conectar.
          </p>
        </div>
        <div className={styles.stepsContainer}>
          <div className={`${styles.step} ${styles.step1}`}>
            <div className={styles.stepIcon}>
              <span>1</span>
            </div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Crea Tu Cuenta</h3>
              <p className={styles.stepText}>
                Regístrate en segundos con tu correo institucional y completa tu perfil.
              </p>
            </div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${styles.step2}`}>
            <div className={styles.stepIcon}>
              <span>2</span>
            </div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Publica o Busca</h3>
              <p className={styles.stepText}>
                Sube tus productos/servicios o explora los anuncios de otros estudiantes.
              </p>
            </div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${styles.step3}`}>
            <div className={styles.stepIcon}>
              <span>3</span>
            </div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Conecta y Transacciona</h3>
              <p className={styles.stepText}>
                Usa el chat directo para coordinar y realizar tus intercambios de forma segura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
