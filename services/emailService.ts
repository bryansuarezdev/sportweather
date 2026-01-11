import emailjs from '@emailjs/browser';
import { canSendEmail, recordEmailSent } from './emailLimitService';

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

export interface SupportTicket {
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
}

export const sendSupportEmail = async (ticket: SupportTicket): Promise<boolean> => {
  // Validar que EmailJS esté configurado
  if (!serviceId || !templateId || !publicKey) {
    console.error('❌ EmailJS no está configurado.');
    console.error('Configura estas variables en .env.local:');
    console.error('- VITE_EMAILJS_SERVICE_ID');
    console.error('- VITE_EMAILJS_TEMPLATE_ID');
    console.error('- VITE_EMAILJS_PUBLIC_KEY');
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  // Verificar límite de emails
  const { allowed, remaining, resetDate } = await canSendEmail(ticket.userEmail);

  if (!allowed) {
    console.warn(`⚠️ Límite de emails alcanzado para: ${ticket.userEmail}`);
    throw new Error('EMAIL_LIMIT_REACHED');
  }

  console.log(`✅ Email permitido. Quedan ${remaining} mensaje(s) disponible(s).`);

  try {
    // Inicializar EmailJS con la public key
    emailjs.init(publicKey);

    // Enviar email
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        from_name: ticket.userName,
        from_email: ticket.userEmail,
        subject: ticket.subject,
        message: ticket.message,
        to_name: 'Administrador SportWeather',
      }
    );

    // Registrar que se envió el email
    await recordEmailSent(ticket.userEmail);

    console.log('✅ Email enviado exitosamente:', response);
    return true;
  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
};
