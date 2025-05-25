import React from 'react';

export default function StepUniversidad({ session, styles }) {
  const university = session?.user?.university;
  const campus = session?.user?.campus;

  return (
    <div className={styles.stepContainer}>
      <div className={styles.universityInfoContainer}>
        <div className={styles.universityHeader}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={styles.universityIcon}
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
          <h3>Información Universitaria</h3>
        </div>
        
        <p className={styles.universityDescription}>
          Esta información se asociará automáticamente a tu publicación para que otros estudiantes 
          de tu universidad puedan encontrarla más fácilmente.
        </p>

        <div className={styles.universityDetails}>
          <div className={styles.universityField}>
            <label className={styles.universityLabel}>Universidad:</label>
            <div className={styles.universityValue}>
              {university || "No especificada"}
            </div>
          </div>

          <div className={styles.universityField}>
            <label className={styles.universityLabel}>Campus:</label>
            <div className={styles.universityValue}>
              {campus || "No especificado"}
            </div>
          </div>
        </div>

        {(!university || !campus) && (
          <div className={styles.universityWarning}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <p><strong>Información incompleta</strong></p>
              <p>
                Para una mejor experiencia, te recomendamos completar tu información universitaria 
                en tu perfil. Puedes hacerlo en <strong>Configuraciones → Universidad</strong>.
              </p>
            </div>
          </div>
        )}

        <div className={styles.universityNote}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          <span>
            Esta información no se puede modificar desde aquí. Si necesitas cambiarla, 
            ve a tu perfil en Configuraciones.
          </span>
        </div>
      </div>
    </div>
  );
} 