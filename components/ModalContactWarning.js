"use client";
import styles from "./modalContactWarning.module.css";
import { FaExclamationTriangle, FaWhatsapp, FaEnvelope, FaPhone } from "react-icons/fa";

export default function ModalContactWarning({ open, onClose, onConfirm, contactMethod, contactInfo }) {
  if (!open) return null;

  const getContactIcon = () => {
    switch (contactMethod) {
      case 'whatsapp':
        return <FaWhatsapp style={{ color: '#25D366' }} />;
      case 'email':
        return <FaEnvelope style={{ color: '#6366f1' }} />;
      case 'telefono':
        return <FaPhone style={{ color: '#10b981' }} />;
      default:
        return null;
    }
  };

  const getContactLabel = () => {
    switch (contactMethod) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'email':
        return 'correo electrónico';
      case 'telefono':
        return 'teléfono';
      default:
        return 'contacto externo';
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <FaExclamationTriangle className={styles.warningIcon} />
          <h2 className={styles.title}>Advertencia de Contacto Externo</h2>
        </div>
        
        <div className={styles.content}>
          <div className={styles.contactInfo}>
            {getContactIcon()}
            <span>Vas a contactar vía {getContactLabel()}</span>
          </div>
          
          <div className={styles.warningText}>
            <p><strong>⚠️ Importante:</strong></p>
            <ul>
              <li>Estás a punto de salir de entreestudiantes.cl para contactar directamente con otro usuario.</li>
              <li>La comunicación será externa a nuestra plataforma y no podemos monitorear ni garantizar su seguridad.</li>
              <li>Nunca compartas información personal sensible (RUT, contraseñas, datos bancarios) en el primer contacto.</li>
              <li>Verifica siempre la identidad del vendedor antes de realizar cualquier transacción.</li>
              <li>Para transacciones de alto valor, considera reunirte en lugares públicos y seguros.</li>
            </ul>
          </div>

          <div className={styles.legalNote}>
            <p><strong>Responsabilidad:</strong></p>
            <p><strong>entreestudiantes.cl</strong> es exclusivamente una plataforma digital que conecta personas para facilitar el intercambio de productos y servicios entre estudiantes. No somos intermediarios, vendedores, compradores ni participamos de manera alguna en las transacciones que se realicen entre usuarios.</p>
            <p>Según nuestros Términos de Uso, cada usuario es completamente responsable de sus comunicaciones externas a la plataforma. <strong>entreestudiantes.cl no se hace responsable por transacciones, fraudes, estafas, problemas de calidad, incumplimientos contractuales, daños, pérdidas o cualquier tipo de inconveniente que puedan surgir en comunicaciones, negociaciones o transacciones realizadas fuera de la plataforma.</strong></p>
            <p>Al continuar, usted acepta que lo hace bajo su propio riesgo y responsabilidad. La plataforma actúa únicamente como un medio de conexión entre personas.</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className={styles.confirmButton} 
            onClick={onConfirm}
          >
            Entiendo y quiero continuar
          </button>
        </div>
      </div>
    </div>
  );
} 