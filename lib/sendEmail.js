import nodemailer from 'nodemailer';

// Create SMTP transporter using your email server
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  name: 'entreestudiantes.cl', // Hostname for HELO/EHLO to fix reverse DNS mismatch
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Accept self-signed certificates if needed
    ciphers: 'SSLv3'
  },
  // Connection timeout
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

/**
 * Envía un email usando SMTP
 * @param {Object} options
 * @param {string} options.to - Email de destino
 * @param {string} options.subject - Asunto del email
 * @param {string} options.html - Contenido HTML del email
 * @param {string} [options.from] - Remitente (opcional, por defecto noresponder@entreestudiantes.cl)
 * @returns {Promise<Object>} Respuesta del envío
 */
export async function sendEmail({ to, subject, html, from }) {
  const emailFrom = from || `Entreestudiantes <${process.env.SMTP_USER || 'noresponder@entreestudiantes.cl'}>`;
  
  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to: to,
      subject: subject,
      html: html,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { error: error.message };
  }
}
