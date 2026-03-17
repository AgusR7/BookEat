import nodemailer from 'nodemailer';
import { generateReservationICS } from './calendar';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  attachments?: { filename: string; content: string; contentType: string }[],
  icsContent?: string,
  html?: string // Nuevo parámetro opcional
) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `no-reply@${(process.env.FRONTEND_URL || '').replace(/https?:\/\//, '')}`,
    to,
    subject,
    text,
    html, // Se agrega html aquí
    attachments,
    alternatives: icsContent
      ? [
          {
            contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
            content: icsContent
          }
        ]
      : undefined,
  });
};

export const sendReservationConfirmationEmail = async (
  email: string,
  restaurantName: string,
  guests: number,
  date: number
) => {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Montevideo'
  });

  // Google Calendar date format: YYYYMMDDTHHmmSSZ
  const start = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(eventDate.getTime() + (1 * 60 + 15) * 60 * 1000); // 1h 15min
  const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=Reserva+${encodeURIComponent(restaurantName)}&dates=${start}/${end}&details=Reserva+para+${guests}+personas+en+${encodeURIComponent(restaurantName)}&location=${encodeURIComponent(restaurantName)}&sf=true&output=xml`;

  const html = `
    <p>Tu reserva en <b>${restaurantName}</b> para <b>${guests}</b> personas el <b>${formattedDate}hs</b> ha sido confirmada.</p>
    <a href="${googleCalendarUrl}" target="_blank" style="
      display: inline-block;
      padding: 12px 24px;
      background-color: #ff3c5c;
      color: #fff;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      margin-top: 16px;
    ">Añadir a Google Calendar</a>
    <p>También se adjunta una invitación para otros calendarios.</p>
  `;

  const icsContent = await generateReservationICS({
    restaurant: restaurantName,
    date: eventDate,
    guests,
    email
  });

  await sendMail(
    email,
    'Confirmación de reserva',
    `Tu reserva en ${restaurantName} para ${guests} personas el ${formattedDate}hs ha sido confirmada.`,
    [
      {
        filename: `Reserva-${restaurantName}.ics`,
        content: icsContent,
        contentType: 'text/calendar; method=REQUEST; charset=UTF-8'
      }
    ],
    icsContent,
    html // Se pasa el html aquí
  );
};

export const sendReservationCancellationEmail = async (
  email: string,
  restaurantName: string,
  guests: number,
  date: number
) => {
  const formattedDate = new Date(date).toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Montevideo'
  });
  await sendMail(
    email,
    'Cancelación de reserva',
    `Tu reserva en ${restaurantName} para ${guests} personas el ${formattedDate}hs ha sido cancelada.`
  );
};
