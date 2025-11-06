/**
 * Appointment Email Templates
 */

import {
  createEmailContainer,
  createHeader,
  createContentSection,
  createFooter,
  htmlToPlainText,
} from '../utils/html-builder';
import { emailPreferencesManager } from '@/lib/email-preferences';
import { AppointmentData } from '../core/types';

export function generateAppointmentConfirmationEmail(data: AppointmentData): { html: string; text: string } {
  const dateObj = new Date(data.appointment_date);
  const formattedDate = dateObj.toLocaleDateString('ru-RU');

  const content = `
    ${createHeader('🎉 Booking Confirmed!', 'Your consultation is successfully booked')}
    ${createContentSection(`
      <h2 style="color: #2d5a2d; margin-top: 0;">📅 Meeting Details</h2>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <p><strong>📅 Date:</strong> ${formattedDate}</p>
        <p><strong>🕐 Time:</strong> ${data.appointment_time} (MSK)</p>
        <p><strong>👤 Name:</strong> ${data.name}</p>
        <p><strong>📧 Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>📞 Phone:</strong> ${data.phone}</p>` : ''}
        ${data.timezone ? `<p><strong>🌐 Timezone:</strong> ${data.timezone}</p>` : ''}
      </div>

      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h3 style="color: #2d5a2d; margin-top: 0;">📋 What to expect:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Business analysis</li>
          <li>Sales growth strategy</li>
          <li>Practical recommendations</li>
          <li>Q&A session</li>
        </ul>
      </div>

      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h3 style="color: #856404; margin-top: 0;">⚠️ Important:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Meeting via Google Meet</li>
          <li>Duration: 60 minutes</li>
          <li>Prepare your questions in advance</li>
        </ul>
      </div>

      ${data.google_meet_link ? `
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h3 style="color: #1976d2; margin-top: 0;">🎥 Google Meet</h3>
        <p style="margin: 10px 0;">
          <strong>Meeting link:</strong><br>
          <a href="${data.google_meet_link}"
             style="color: #1976d2; text-decoration: none; font-weight: bold; word-break: break-all;">
            ${data.google_meet_link}
          </a>
        </p>
        ${data.meeting_id ? `<p style="margin: 10px 0; font-size: 14px; color: #666;">Meeting ID: ${data.meeting_id}</p>` : ''}
      </div>
      ` : ''}
    `)}

    <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
      <p style="margin: 0; color: #666;">
        If you have any questions, contact us:<br>
        📧 support@example.com<br>
        📞 +7 (999) 123-45-67
      </p>
    </div>
  `;

  const token = emailPreferencesManager.generateToken(data.email);
  const html = createEmailContainer(content + createFooter(data.email, token));
  const text = htmlToPlainText(html);

  return { html, text };
}

export function generateAppointmentReminderEmail(data: AppointmentData): { html: string; text: string } {
  const dateObj = new Date(data.appointment_date);
  const formattedDate = dateObj.toLocaleDateString('ru-RU');

  const content = `
    ${createHeader('⏰ Meeting Reminder', 'Your consultation is tomorrow')}
    ${createContentSection(`
      <h2 style="color: #2d5a2d; margin-top: 0;">📅 Meeting Details</h2>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <p><strong>📅 Date:</strong> ${formattedDate}</p>
        <p><strong>🕐 Time:</strong> ${data.appointment_time} (MSK)</p>
        <p><strong>👤 Name:</strong> ${data.name}</p>
        ${data.timezone ? `<p><strong>🌐 Timezone:</strong> ${data.timezone}</p>` : ''}
      </div>

      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h3 style="color: #2d5a2d; margin-top: 0;">✅ Preparation:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Check your internet connection</li>
          <li>Prepare your questions</li>
          <li>Find a quiet place</li>
          <li>Be ready to take notes</li>
        </ul>
      </div>

      ${data.google_meet_link ? `
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h3 style="color: #1976d2; margin-top: 0;">🎥 Google Meet</h3>
        <p style="margin: 10px 0;">
          <strong>Meeting link:</strong><br>
          <a href="${data.google_meet_link}"
             style="color: #1976d2; text-decoration: none; font-weight: bold; word-break: break-all;">
            ${data.google_meet_link}
          </a>
        </p>
        ${data.meeting_id ? `<p style="margin: 10px 0; font-size: 14px; color: #666;">Meeting ID: ${data.meeting_id}</p>` : ''}
      </div>
      ` : ''}
    `)}

    <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
      <p style="margin: 0; color: #666;">
        Need to reschedule? Contact us ASAP:<br>
        📧 support@example.com<br>
        📞 +7 (999) 123-45-67
      </p>
    </div>
  `;

  const token = emailPreferencesManager.generateToken(data.email);
  const html = createEmailContainer(content + createFooter(data.email, token));
  const text = htmlToPlainText(html);

  return { html, text };
}

export function getAppointmentConfirmationSubject(data: AppointmentData): string {
  return '✅ Appointment Confirmed - AstroForYou';
}

export function getAppointmentReminderSubject(data: AppointmentData): string {
  const dateObj = new Date(data.appointment_date);
  const formattedDate = dateObj.toLocaleDateString('ru-RU');
  return `Reminder: Your appointment on ${formattedDate} at ${data.appointment_time}`;
}
