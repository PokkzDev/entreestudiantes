import { getPrivacyPolicy } from '@/lib/legal-content';
import LegalContent from '@/components/LegalContent';
import BackToTopButton from '@/components/BackToTopButton';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Política de Privacidad | Entre Estudiantes',
  description: 'Política de privacidad de entreestudiantes.cl - Conoce cómo protegemos y manejamos tus datos personales.',
  robots: 'index, follow',
};

export default function PoliticaPrivacidadPage() {
  const privacyPolicy = getPrivacyPolicy();

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Inicio</Link>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span className={styles.breadcrumbCurrent}>Política de Privacidad</span>
      </div>
      
      <main className={styles.main}>
        <LegalContent document={privacyPolicy} isModal={false} />
        
        <BackToTopButton />
      </main>
    </div>
  );
} 