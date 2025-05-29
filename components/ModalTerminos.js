"use client";
import { useState } from "react";
import styles from "./modalTerminos.module.css";

export default function ModalTerminos({ open, onClose }) {
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
            TÉRMINOS DE USO DE "entreestudiantes.cl"
          </h2>
          <p className={styles.legalDate}>
            Fecha de última actualización: 15 de mayo de 2025
          </p>

          <section className={styles.legalSectionContainer} style={{ fontSize: "1.05rem" }}>
            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Responsabilidad sobre los Contenidos de Usuario</h3>
              <p className={styles.legalParagraph}>
                Cada Usuario es único responsable del contenido que publique en la Plataforma,
                incluyendo textos, imágenes y vínculos. La plataforma <strong>entreestudiantes.cl </strong>
                actúa exclusivamente como un medio técnico de publicación. No asume
                responsabilidad por la veracidad, exactitud o legalidad de los contenidos
                generados por terceros, pero se reserva el derecho de revisar, suspender o
                eliminar cualquier publicación que, a juicio de sus administradores o de las
                instituciones competentes, infrinja estos Términos o la normativa aplicable.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Contenido Prohibido</h3>
              <p className={styles.legalParagraph}>
                Se prohíbe de forma absoluta la publicación de cualquier contenido que
                promueva o facilite: actividades ilícitas, pornografía, abuso o explotación
                sexual, apología de drogas o sustancias controladas, discursos de odio,
                terrorismo, violencia extrema o violación de derechos de propiedad intelectual.
                Toda vulneración de estas prohibiciones será considerada falta grave, que
                puede conllevar la suspensión inmediata de la cuenta y la eliminación
                definitiva del contenido.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Monitoreo y Colaboración con Autoridades</h3>
              <p className={styles.legalParagraph}>
                La plataforma podrá monitorear activamente las publicaciones para garantizar
                el cumplimiento de la ley y estos Términos. En caso de detectarse
                infracciones, entreestudiantes.cl se reserva el derecho de compartir datos
                de los Usuarios con las autoridades competentes o con los representantes
                legales de instituciones académicas que requieran información para fines de
                investigación o sanción disciplinaria.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Indemnización y Exención de Responsabilidad</h3>
              <p className={styles.legalParagraph}>
                El Usuario se compromete a indemnizar y mantener indemne a
                entreestudiantes.cl, sus colaboradores y administradores frente a cualquier
                reclamación, daño o gasto (incluidos honorarios de abogados) relacionado
                con el contenido que publique o difunda. La plataforma no garantiza ni
                respalda contenidos de terceros y no será responsable por daños directos,
                indirectos, incidentales o emergentes ocasionados por el uso o la imposibilidad
                de uso de la Plataforma o de los contenidos publicados.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Partes</h3>
              <p className={styles.legalParagraph}>
                El sitio web <strong>entreestudiantes.cl</strong> (en adelante, "la Plataforma")
                y toda persona natural o jurídica que accede o utiliza los servicios ofrecidos
                en la Plataforma (en adelante, "el Usuario" o "los Usuarios") acuerdan regirse
                por estos Términos de Uso.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Definiciones</h3>
              <p className={styles.legalParagraph}>
                Para efectos de estos Términos, se entenderá por "Cuenta" el conjunto de
                credenciales que el Usuario crea para acceder a la Plataforma; por
                "Publicación" el anuncio de producto o servicio que el Usuario genera,
                incluyendo texto, imágenes, precios, categorías y datos de contacto; por
                "Contenido de Usuario" todo texto, imagen o archivo multimedia que el
                Usuario publique; y por "Servicios" el conjunto de funcionalidades disponibles
                (registro, autenticación, publicación, búsqueda, mensajería, panel de usuario, etc.).
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Aceptación de los Términos</h3>
              <p className={styles.legalParagraph}>
                Al registrarse, acceder o utilizar la Plataforma, el Usuario declara ser
                mayor de edad o contar con la autorización de su representante legal,
                haber leído, entendido y aceptado íntegramente estos Términos y, en caso
                de desacuerdo con alguna disposición, se compromete a no usar la Plataforma.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Objeto</h3>
              <p className={styles.legalParagraph}>
                Estos Términos regulan el uso de la Plataforma y sus Servicios, así como
                los derechos y obligaciones de las partes en la interacción y las
                transacciones que se realicen entre Usuarios.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Registro y Autenticación</h3>
              <p className={styles.legalParagraph}>
                Para hacer uso de los Servicios, el Usuario debe crear una Cuenta
                proporcionando un correo electrónico válido y una contraseña segura. Tras
                completar el registro, el Usuario recibirá un correo de verificación que
                deberá confirmar. El Usuario es responsable de la confidencialidad de sus
                credenciales y de cualquier actividad bajo su Cuenta. La opción
                "Recuérdame" permite mantener la sesión iniciada en el dispositivo seleccionado.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Recuperación y Cambio de Contraseña</h3>
              <p className={styles.legalParagraph}>
                En caso de olvido, el Usuario podrá solicitar el restablecimiento de su
                contraseña mediante un enlace enviado a su correo electrónico. El Usuario
                también podrá cambiarla en cualquier momento desde su panel de usuario.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Publicación de Productos y Servicios</h3>
              <p className={styles.legalParagraph}>
                El Usuario puede publicar productos o servicios, describiendo cada anuncio
                con título, descripción, categoría, precio, fotografías y datos de
                contacto (WhatsApp, correo o teléfono). El Usuario garantiza la veracidad
                de la información y se abstendrá de publicar contenidos ilegales,
                ofensivos o que vulneren derechos de terceros.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Gestión y Control de Publicaciones</h3>
              <p className={styles.legalParagraph}>
                Desde "Mis Publicaciones" el Usuario puede editar, pausar, reactivar o
                eliminar sus anuncios y consultar estadísticas básicas. La Plataforma se
                reserva el derecho de eliminar cualquier publicación que incumpla estos
                Términos o la ley, sin previo aviso.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Búsqueda y Exploración</h3>
              <p className={styles.legalParagraph}>
                La Plataforma ofrece herramientas de búsqueda avanzada para filtrar
                publicaciones por tipo, categoría y palabras clave. El Usuario puede
                acceder a la ficha completa de cada publicación y contactar directamente
                al anunciante.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Panel de Usuario</h3>
              <p className={styles.legalParagraph}>
                En el panel de usuario se administran datos personales, publicaciones,
                estadísticas, notificaciones y la opción de solicitar la eliminación de
                la Cuenta.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Contacto Directo</h3>
              <p className={styles.legalParagraph}>
                La comunicación entre Usuarios se realiza mediante los datos proporcionados
                por cada anunciante. Entreestudiantes.cl no interviene en las negociaciones
                ni cobra comisiones.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Responsabilidad de Comunicaciones Externas</h3>
              <p className={styles.legalParagraph}>
                <strong>entreestudiantes.cl</strong> es exclusivamente una plataforma digital que conecta personas para facilitar el intercambio de productos y servicios entre estudiantes. No somos intermediarios, vendedores, compradores ni participamos de manera alguna en las transacciones que se realicen entre usuarios.
              </p>
              <p className={styles.legalParagraph}>
                Según nuestros Términos de Uso, cada usuario es completamente responsable de sus comunicaciones externas a la plataforma. <strong>entreestudiantes.cl no se hace responsable por transacciones, fraudes, estafas, problemas de calidad, incumplimientos contractuales, daños, pérdidas o cualquier tipo de inconveniente que puedan surgir en comunicaciones, negociaciones o transacciones realizadas fuera de la plataforma.</strong>
              </p>
              <p className={styles.legalParagraph}>
                Al utilizar los datos de contacto proporcionados por otros usuarios, usted acepta que lo hace bajo su propio riesgo y responsabilidad. La plataforma actúa únicamente como un medio de conexión entre personas y no garantiza la veracidad, confiabilidad o seguridad de los usuarios registrados ni de las transacciones que estos puedan realizar.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Eliminación de Cuenta</h3>
              <p className={styles.legalParagraph}>
                El Usuario puede solicitar en cualquier momento la baja definitiva de su
                Cuenta y la eliminación de sus datos y publicaciones. Una vez confirmada,
                la información será borrada de forma segura y no podrá recuperarse.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Propiedad Intelectual</h3>
              <p className={styles.legalParagraph}>
                El contenido, diseño y código de la Plataforma son propiedad de los
                desarrolladores de entreestudiantes.cl. El Usuario conserva los derechos de
                sus contenidos, otorgando a la Plataforma una licencia no exclusiva para
                mostrarlos y almacenarlos mientras existan en la plataforma.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Protección de Datos Personales</h3>
              <p className={styles.legalParagraph}>
                El tratamiento de datos personales se rige por la Política de Privacidad
                disponible en la Plataforma. El Usuario presta su consentimiento para el
                almacenamiento y uso de sus datos conforme a dicha política y la normativa
                chilena aplicable.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Exención de Garantías y Limitación de Responsabilidad</h3>
              <p className={styles.legalParagraph}>
                La Plataforma y sus servicios se ofrecen "tal cual" y "según
                disponibilidad", sin garantías expresa o implícitas. Entreestudiantes.cl no
                será responsable por daños directos o indirectos derivados del uso de la
                Plataforma o de los contenidos de Usuario.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Modificaciones de los Términos</h3>
              <p className={styles.legalParagraph}>
                Entreestudiantes.cl puede actualizar estos Términos en cualquier momento.
                La versión vigente estará visible en la Plataforma con su fecha de última
                actualización. El uso continuado implica aceptación de los cambios.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h3 className={styles.legalSectionTitle}>Legislación Aplicable y Jurisdicción</h3>
              <p className={styles.legalParagraph}>
                Estos Términos se rigen por las leyes de la República de Chile y cualquier
                controversia se somete a los tribunales ordinarios de Chillán, Chile.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
