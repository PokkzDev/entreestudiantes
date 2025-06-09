import { getTermsOfService } from '@/lib/legal-content';
import LegalContent from '@/components/LegalContent';
import BackToTopButton from '@/components/BackToTopButton';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Términos de Uso | Entre Estudiantes',
  description: 'Términos de uso de entreestudiantes.cl - Conoce las reglas y condiciones para usar nuestra plataforma.',
  robots: 'index, follow',
};

export default function TerminosUsoPage() {
  const termsOfService = getTermsOfService();

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Inicio</Link>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span className={styles.breadcrumbCurrent}>Términos de Uso</span>
      </div>
      
      <main className={styles.main}>
        <LegalContent document={termsOfService} isModal={false} />
        
        <BackToTopButton />
      </main>
    </div>
  );
} 