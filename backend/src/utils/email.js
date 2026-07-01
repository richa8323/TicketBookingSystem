const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// HTML escaping helper to prevent injection in email layouts
function escapeHTML(str) {
  if (!str) return '';
  return str.toString().replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.EMAIL_PORT) || 2525,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

// Warn if SMTP credentials are not specified
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('[Email Service Warning] SMTP credentials (EMAIL_USER/EMAIL_PASS) are missing. E-ticket delivery will fail or fallback to defaults.');
}

// Verify SMTP connection credentials on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[Email Service] SMTP configuration is invalid:', error);
  } else {
    console.log('[Email Service] SMTP server connection validated successfully.');
  }
});

const sendTicketEmail = async (userEmail, booking, event) => {
  try {
    const qrBuffer = await QRCode.toBuffer(booking.bookingReference);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-top: 0;">Ticket Confirmation</h2>
        <p>Thank you for booking with TicketPass! Your booking reference is <strong>${escapeHTML(booking.bookingReference)}</strong>.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
          <h3 style="margin-top: 0; color: #1e293b; font-size: 18px;">${escapeHTML(event.title)}</h3>
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Time:</strong> ${escapeHTML(event.startTime)} - ${escapeHTML(event.endTime)}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Venue:</strong> ${escapeHTML(event.venue?.name)}, ${escapeHTML(event.venue?.location)}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Seats:</strong> ${escapeHTML(booking.seats.join(', '))}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        </div>

        <p style="font-size: 14px; color: #475569;">Scan the QR code below at the entrance gate to check in:</p>
        <div style="text-align: center; margin: 24px 0;">
          <img src="cid:ticketqrcode" alt="Gate Pass QR" style="width: 160px; height: 160px; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;" />
        </div>

        <p style="color: #64748b; font-size: 11px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          This is an automated receipt. If you have questions, contact system support.
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TicketPass Systems" <support@ticketpass.com>',
      to: userEmail,
      subject: `Booking Confirmed: ${escapeHTML(event.title)} (${escapeHTML(booking.bookingReference)})`,
      html: htmlContent,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrBuffer,
          cid: 'ticketqrcode'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Sent ticket email to ${userEmail} for booking ${booking.bookingReference}`);
  } catch (err) {
    console.error('[Email Service Error] Failed to send ticket email:', err);
  }
};

module.exports = { sendTicketEmail };
