/**
 * Admin Notification Email Templates
 */

import { AppointmentData } from '../core/types';

export function generateAdminNotificationEmail(appointmentData: AppointmentData): { html: string; subject: string } {
  const dateObj = new Date(appointmentData.appointment_date);
  const formattedDate = dateObj.toLocaleDateString('ru-RU');

  const html = `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc3545; color: white; padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🆕 Новая запись!</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Получена новая заявка на консультацию</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #dc3545; margin-top: 0;">📋 Детали клиента</h2>

                <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>👤 Имя:</strong> ${appointmentData.name}</p>
                    <p><strong>📧 Email:</strong> ${appointmentData.email}</p>
                    <p><strong>📞 Телефон:</strong> ${appointmentData.phone}</p>
                    <p><strong>🌐 Сайт:</strong> ${appointmentData.website || 'Не указан'}</p>
                    <p><strong>💰 Доход:</strong> ${appointmentData.revenue || 'Не указан'}</p>
                </div>

                <h2 style="color: #dc3545; margin-top: 30px;">📅 Детали встречи</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>📅 Дата:</strong> ${formattedDate}</p>
                    <p><strong>🕐 Время:</strong> ${appointmentData.appointment_time}</p>
                    ${appointmentData.timezone ? `<p><strong>🌐 Временная зона:</strong> ${appointmentData.timezone}</p>` : ''}
                    ${appointmentData.google_meet_link ? `<p><strong>🎥 Google Meet:</strong> <a href="${appointmentData.google_meet_link}">${appointmentData.google_meet_link}</a></p>` : ''}
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                <p>This is an automated notification from the AstroForYou system</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const subject = `🆕 Новая запись: ${appointmentData.name} - ${formattedDate}`;

  return { html, subject };
}

export function generateTestEmail(adminEmail: string): { html: string; subject: string } {
  const timestamp = new Date().toISOString();

  const html = `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4A148C 0%, #7B1FA2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">✅ Test Email</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Email system is working correctly!</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #4A148C; margin-top: 0;">📊 Test Details</h2>

                <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>📧 To:</strong> ${adminEmail}</p>
                    <p><strong>⏰ Sent at:</strong> ${timestamp}</p>
                    <p><strong>✅ Status:</strong> Successfully delivered</p>
                </div>

                <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4caf50;">
                    <p style="margin: 0; color: #2e7d32;">
                        <strong>✓ Email configuration is working correctly!</strong><br>
                        SMTP connection successful and email delivered.
                    </p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                <p>This is an automated test email from the AstroForYou system</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const subject = `✅ Test Email - ${timestamp}`;

  return { html, subject };
}

export function generateSimpleTestEmail(testEmail: string): { html: string; text: string; subject: string } {
  const timestamp = new Date().toISOString();

  const text = `This is a simple test email sent at ${timestamp}`;
  const html = `<p>This is a simple test email sent at ${timestamp}</p>`;
  const subject = 'Simple Test Email';

  return { html, text, subject };
}
