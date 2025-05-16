"use client";
import styles from "./modalPrivacidad.module.css";

export default function ModalPrivacidad({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar"
        >
          &times;
        </button>
        <div
          className={styles.content}
          style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "1rem" }}
        >
          <h2 className={styles.legalTitle}>
            POLÍTICA DE PRIVACIDAD DE “entreestudiantes.cl”
          </h2>
          <p className={styles.legalDate}>
            Fecha de última actualización: 15 de mayo de 2025
          </p>

          <section className={styles.legalSectionContainer} style={{ fontSize: "1.05rem" }}>
            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>1. Introducción</h3>
              <p className={styles.legalParagraph}>
                En entreestudiantes.cl (en adelante, “la Plataforma”), valoramos y protegemos la privacidad de nuestros usuarios (en adelante, “el Usuario” o “los Usuarios”). La presente Política de Privacidad detalla cómo recopilamos, utilizamos, almacenamos y protegemos los datos personales proporcionados al utilizar nuestros servicios.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>2. Datos que recopilamos</h3>
              <div className={styles.legalParagraph}>
                Recopilamos los siguientes datos personales cuando el Usuario interactúa con la Plataforma:
                <ul>
                  <li>Correo electrónico y contraseña (para registro y autenticación).</li>
                  <li>Nombre, datos de contacto (correo electrónico, WhatsApp, número telefónico) y cualquier información incluida en las publicaciones.</li>
                  <li>Imágenes y archivos multimedia subidos por el Usuario.</li>
                  <li>Información técnica, como dirección IP, tipo de dispositivo, navegador y datos de uso (registros de acceso, búsquedas, interacciones, etc.).</li>
                </ul>
              </div>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>3. Finalidades del tratamiento de datos</h3>
              <div className={styles.legalParagraph}>
                Los datos personales recopilados se utilizan con los siguientes fines:
                <ul>
                  <li>Crear y gestionar la cuenta del Usuario.</li>
                  <li>Permitir la publicación, edición y eliminación de productos o servicios.</li>
                  <li>Facilitar la comunicación entre Usuarios.</li>
                  <li>Enviar notificaciones relevantes (verificación de cuenta, recuperación de contraseña, avisos importantes, etc.).</li>
                  <li>Mejorar la seguridad de la Plataforma, prevenir fraudes y cumplir con obligaciones legales aplicables.</li>
                </ul>
              </div>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>4. Conservación y eliminación de datos</h3>
              <p className={styles.legalParagraph}>
                Los datos personales se conservarán mientras la cuenta del Usuario permanezca activa. El Usuario puede solicitar la eliminación definitiva de su cuenta y sus datos personales en cualquier momento desde el panel de usuario. Una vez eliminados, los datos no podrán recuperarse.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>5. Compartición de datos</h3>
              <div className={styles.legalParagraph}>
                No compartimos datos personales con terceros, salvo en los siguientes casos:
                <ul>
                  <li>Cuando sea requerido por autoridades competentes o instituciones académicas con fines de investigación o medidas disciplinarias.</li>
                  <li>Cuando el Usuario incluya voluntariamente información de contacto en sus publicaciones, la cual será visible para otros Usuarios.</li>
                  <li>Con proveedores de servicios tecnológicos que colaboran en el funcionamiento de la Plataforma, siempre bajo acuerdos de confidencialidad.</li>
                </ul>
              </div>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>6. Seguridad de la información</h3>
              <p className={styles.legalParagraph}>
                Aplicamos medidas técnicas y organizativas adecuadas para proteger los datos personales contra accesos no autorizados, pérdidas, alteraciones o divulgaciones indebidas. Sin embargo, ningún sistema es completamente infalible, por lo que no podemos garantizar una seguridad absoluta.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>7. Derechos del Usuario</h3>
              <div className={styles.legalParagraph}>
                El Usuario tiene derecho a:
                <ul>
                  <li>Acceder, rectificar o eliminar sus datos personales.</li>
                  <li>Solicitar la limitación del tratamiento u oponerse al mismo.</li>
                  <li>Retirar su consentimiento en cualquier momento, sin que esto afecte la licitud del tratamiento previo.</li>
                </ul>
                Para ejercer estos derechos, el Usuario puede contactarnos a través del correo de soporte indicado en la Plataforma.
              </div>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>8. Cookies y tecnologías similares</h3>
              <p className={styles.legalParagraph}>
                Utilizamos cookies y tecnologías similares para mejorar la experiencia de navegación, analizar el uso de la Plataforma y personalizar el contenido. El Usuario puede configurar las preferencias de cookies desde su navegador.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>9. Modificaciones a esta política</h3>
              <p className={styles.legalParagraph}>
                Nos reservamos el derecho a modificar esta Política de Privacidad en cualquier momento. La versión actualizada estará siempre disponible en la Plataforma, con su respectiva fecha de vigencia. El uso continuado de nuestros servicios implica la aceptación de dichos cambios.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>10. Legislación aplicable</h3>
              <p className={styles.legalParagraph}>
                Esta Política se rige por la legislación vigente en la República de Chile en materia de protección de datos personales.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
