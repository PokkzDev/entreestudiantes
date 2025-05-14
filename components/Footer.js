import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.brandSection}>
            <span className={styles.logo}>Entre Estudiantes</span>
            <p className={styles.description}>La plataforma donde los estudiantes pueden vender, comprar y conectar.</p>
          </div>
          
          <div className={styles.linksWrapper}>
            <div className={styles.linkColumn}>
              <h4>Navegación</h4>
              <nav>
                <Link href="/">Inicio</Link>
                <Link href="/productos">Productos</Link>
                <Link href="/servicios">Servicios</Link>
                <Link href="/comunidades">Comunidades</Link>
                <Link href="/contacto">Contacto</Link>
              </nav>
            </div>
            
            <div className={styles.linkColumn}>
              <h4>Legal</h4>
              <nav>
                <Link href="/terminos">Términos de Servicio</Link>
                <Link href="/privacidad">Política de Privacidad</Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.copyright}>
        <div className={styles.container}>
          <p>© {new Date().getFullYear()} entreestudiantes.online. Todos los derechos reservados.</p>
          <p>Desarrollado por <a href="https://pokkz.dev" target="_blank" rel="noopener noreferrer">Pokkz.dev</a></p>
        </div>
      </div>
    </footer>
  );
}
