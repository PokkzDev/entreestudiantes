import { FaFileAlt, FaWindowMaximize, FaGlobe } from "react-icons/fa";
import Image from 'next/image';
import Link from 'next/link';
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>¡Conecta, vende y encuentra lo que necesitas entre estudiantes universitarios!</h1>
              <p className={styles.heroSubtitle}>La comunidad donde tus ideas, productos y servicios encuentran a otros estudiantes como tú. ¡Haz crecer tu red y tus oportunidades!</p>
              <div className={styles.heroCtas}>
                <Link href="/registro" className="btn btn-primary">Registrarte gratis</Link>
                <Link href="/busqueda" className="btn btn-outline">Buscar Productos</Link>
              </div>
            </div>
            <div className={styles.heroImage}>
              <div className={styles.imageReplacement}>
                <p>Imagen de estudiantes colaborando</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>¿Qué puedes hacer en Entre Estudiantes?</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconContainer}>
                <FaFileAlt aria-hidden style={{ width: 32, height: 32 }} />
              </div>
              <h3>Vender tus Productos</h3>
              <p>Vende libros, materiales, electrónicos y más a otros estudiantes que los necesitan.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconContainer}>
                <FaGlobe aria-hidden style={{ width: 32, height: 32 }} />
              </div>
              <h3>Ofrecer Servicios</h3>
              <p>Comparte tus habilidades: tutoría, diseño, programación, traducción y mucho más.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconContainer}>
                <FaWindowMaximize aria-hidden style={{ width: 32, height: 32 }} />
              </div>
              <h3>Conectar Directamente</h3>
              <p>Contacto directo por WhatsApp o tu plataforma preferida sin intermediarios.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className="container">
          <h2 className={styles.sectionTitle}>¿Cómo funciona?</h2>
          <div className={styles.stepsContainer}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Crea tu cuenta</h3>
                <p>Regístrate gratis y crea un perfil con tu información universitaria.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Publica tus productos o servicios</h3>
                <p>Añade fotos, descripción, precio y forma de contacto preferida.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Conecta con otros estudiantes</h3>
                <p>Recibe mensajes directos de interesados y coordina la venta o servicio.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaFileAlt aria-hidden style={{ width: 16, height: 16 }} />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWindowMaximize aria-hidden style={{ width: 16, height: 16 }} />
          Examples
        </a>
      </footer>
    </div>
  );
}
