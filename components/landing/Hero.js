"use client";

import Link from 'next/link';
import { useSession } from "next-auth/react";
import styles from './landing.module.css';

export default function Hero() {
  const { data: session, status } = useSession();

  return (
    <section className={styles.hero}>
      <div className={styles.heroOverlay}></div>
      <div className={`container ${styles.heroContent}`}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Conecta, Vende y Descubre en tu Comunidad Estudiantil
          </h1>
          <p className={styles.heroSubtitle}>
            La plataforma exclusiva para que estudiantes como tú puedan comprar, vender y conectar de forma segura y directa.
          </p>
          <div className={styles.heroCtas}>
            {status !== "loading" && !session && (
              <Link href="/registro" className={`btn ${styles.btnPrimary}`}>
                Únete Gratis
              </Link>
            )}
            <Link href="/busqueda" className={`btn ${styles.btnSecondary}`}>
              Explorar Anuncios
            </Link>
          </div>
        </div>
        <div className={styles.heroImageContainer}>
          <img 
            src="/pageImages/hero1.jpg" 
            alt="Estudiantes colaborando" 
            className={styles.heroImage}
          />
        </div>
      </div>
    </section>
  );
}
