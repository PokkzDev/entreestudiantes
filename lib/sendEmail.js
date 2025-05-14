import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un email usando Resend
 * @param {Object} options
 * @param {string} options.to - Email de destino
 * @param {string} options.subject - Asunto del email
 * @param {string} options.html - Contenido HTML del email
 * @param {string} [options.from] - Remitente (opcional, por defecto noresponder@entreestudiantes.online)
 * @returns {Promise<Object>} Respuesta de Resend
 */
export async function sendEmail({ to, subject, html, from }) {
  const resendFrom = from || 'Entreestudiantes <noresponder@entreestudiantes.online>';
  try {
    const response = await resend.emails.send({
      from: resendFrom,
      to: [to],
      subject,
      html,
    });
    return response;
  } catch (error) {
    console.error('Error enviando email:', error);
    return { error };
  }
}
