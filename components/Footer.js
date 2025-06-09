"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ModalTerminos from "./ModalTerminos";
import ModalPrivacidad from "./ModalPrivacidad";
import styles from "./Footer.module.css";

export default function Footer() {
  const [showTerminos, setShowTerminos] = useState(false);
  const [showPrivacidad, setShowPrivacidad] = useState(false);
  const [showAuthLinks, setShowAuthLinks] = useState(false);


  return (
    <footer className={styles.footer}>
      <ModalTerminos open={showTerminos} onClose={() => setShowTerminos(false)} />
      <ModalPrivacidad open={showPrivacidad} onClose={() => setShowPrivacidad(false)} />
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
                <Link href="/busqueda">Búsqueda</Link>
                <Link href="/planes">Planes</Link>
                
              </nav>
            </div>
            
            <div className={styles.linkColumn}>
              <h4>Ayuda</h4>
              <nav>
                <Link href="/contacto">Contacto</Link>
                <Link href="/sugerencias">Sugerencias y Comentarios</Link>
              </nav>
            </div>
            
            <div className={styles.linkColumn}>
              <h4>Legal</h4>
              <nav>
                <Link href="/terminos-uso">Términos de Uso</Link>
                <Link href="/politica-privacidad">Política de Privacidad</Link>
                
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.copyright}>
        <div className={styles.container}>
          <p>© {new Date().getFullYear()} <b>entreestudiantes.cl</b>. Todos los derechos reservados.</p>
          <p>Desarrollado por <a href="https://pokkz.dev" target="_blank" rel="noopener noreferrer" className={styles.devAttribution}>Pokkz.dev</a></p>
        </div>
      </div>
    </footer>
  );
}
