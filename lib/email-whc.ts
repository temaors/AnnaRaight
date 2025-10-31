import nodemailer from 'nodemailer';
import { emailPreferencesManager } from './email-preferences';

export interface WHCEmailConfig {
  smtpServer: string;
  smtpPort: number;
  senderEmail: string;
  senderPassword: string;
  useTLS: boolean;
  useSSL: boolean;
  adminEmail: string;
}

export interface AppointmentData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  revenue?: string;
  currentLevel?: string;
  desiredLevel?: string;
  currentIncome?: string;
  decisionMaker?: string;
  appointment_date: string;
  appointment_time: string;
  timezone?: string;
  google_meet_link?: string;
  meeting_id?: string;
}

class WHCEmailManager {
  private transporter: nodemailer.Transporter;
  private config: WHCEmailConfig;

  constructor(config?: WHCEmailConfig) {
    // Default WHC.ca configuration
    this.config = config || {
      smtpServer: process.env.WHC_SMTP_SERVER || 'mail.yourdomain.com',
      smtpPort: parseInt(process.env.WHC_SMTP_PORT || '465'),
      senderEmail: process.env.WHC_SENDER_EMAIL || 'noreply@yourdomain.com',
      senderPassword: process.env.WHC_SENDER_PASSWORD || '',
      useTLS: process.env.WHC_USE_TLS === 'true',
      useSSL: process.env.WHC_USE_SSL === 'true',
      adminEmail: process.env.WHC_ADMIN_EMAIL || 'admin@yourdomain.com',
    };
    
    console.log('📧 [EMAIL CONFIG] SMTP Settings:', {
      host: this.config.smtpServer,
      port: this.config.smtpPort,
      secure: this.config.useSSL,
      user: this.config.senderEmail,
      useTLS: this.config.useTLS
    });

    this.transporter = nodemailer.createTransport({
      host: this.config.smtpServer,
      port: this.config.smtpPort,
      secure: this.config.useSSL, // true for 465, false for other ports
      auth: {
        user: this.config.senderEmail,
        pass: this.config.senderPassword,
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 60000,   // 60 seconds  
      socketTimeout: 60000,     // 60 seconds
      tls: {
        rejectUnauthorized: false, // Only for development
        minVersion: 'TLSv1',
        ciphers: 'ALL'
      },
      debug: true, // Enable debug output
      logger: true // Enable logger
    });
  }

  // Test connection method
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      console.error('WHC Email connection test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendAppointmentConfirmation(appointmentData: AppointmentData): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive appointment emails
      const canSend = await emailPreferencesManager.canSendEmail(appointmentData.email, 'appointment');
      if (!canSend) {
        console.log(`📧 Skipping appointment email to ${appointmentData.email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log('🔍 Starting sendAppointmentConfirmation...');
      console.log('📧 SMTP Config:', {
        host: this.config.smtpServer,
        port: this.config.smtpPort,
        user: this.config.senderEmail,
        secure: this.config.useSSL
      });
      
      const dateObj = new Date(appointmentData.appointment_date);
      const formattedDate = dateObj.toLocaleDateString('en-US');

      // Create Google Calendar URL
      const startDate = new Date(`${appointmentData.appointment_date}T${appointmentData.appointment_time}:00`);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
      
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=AstroForYou Consultation - ${appointmentData.name}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=Consultation with AstroForYou team. Name: ${appointmentData.name}, Email: ${appointmentData.email}, Phone: ${appointmentData.phone}&location=${appointmentData.google_meet_link || 'Online Meeting'}`;

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">✅ Appointment Confirmed!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Hi ${appointmentData.name}! Your consultation is confirmed</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #2d5a2d; margin-top: 0;">📅 Meeting Details</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>📅 Date:</strong> ${formattedDate}</p>
                        <p><strong>🕐 Time:</strong> ${appointmentData.appointment_time}</p>
                        <p><strong>👤 Name:</strong> ${appointmentData.name}</p>
                        <p><strong>📧 Email:</strong> ${appointmentData.email}</p>
                        <p><strong>📞 Phone:</strong> ${appointmentData.phone}</p>
                        ${appointmentData.timezone ? `<p><strong>🌐 Timezone:</strong> ${appointmentData.timezone}</p>` : ''}
                        ${appointmentData.google_meet_link ? `<p><strong>🔗 Meeting Link:</strong> <a href="${appointmentData.google_meet_link}">${appointmentData.google_meet_link}</a></p>` : ''}
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="${googleCalendarUrl}" style="display: inline-block; background: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                📅 Add to Google Calendar
                            </a>
                        </div>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #2d5a2d; margin-top: 0;">💡 What to Expect on Your Call:</h3>
                        <div style="margin: 15px 0;">
                            <div style="margin-bottom: 15px;">
                                <strong>1. Your Astrology Goals</strong><br>
                                We'll talk about your experience and what you want to achieve with astrology.
                            </div>
                            <div style="margin-bottom: 15px;">
                                <strong>2. Personalized Path</strong><br>
                                You'll see how our course can help you reach those goals step by step.
                            </div>
                            <div style="margin-bottom: 0;">
                                <strong>3. Next Steps</strong><br>
                                We'll outline how to get started and begin your astrology journey.
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>Best regards,<br>AstroForYou Team</p>
                    <p>If you have any questions, contact us at: ${this.config.senderEmail}</p>
                </div>
            </div>
        </body>
        </html>
      `;
      
      // Add unsubscribe footer
      htmlContent = emailPreferencesManager.addUnsubscribeFooter(htmlContent, appointmentData.email);

      const mailOptions = {
        from: `"Anna Raight" <${this.config.senderEmail}>`,
        to: appointmentData.email,
        subject: `✅ Appointment confirmed - ${formattedDate} at ${appointmentData.appointment_time}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true };

    } catch (error) {
      console.error('Error sending appointment confirmation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendAdminNotification(appointmentData: AppointmentData): Promise<{ success: boolean; error?: string }> {
    try {
      const dateObj = new Date(appointmentData.appointment_date);
      const formattedDate = dateObj.toLocaleDateString('ru-RU');

      const htmlContent = `
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
                        <p><strong>🌐 Сайт:</strong> ${appointmentData.website}</p>
                        <p><strong>💰 Доход:</strong> ${appointmentData.revenue}</p>
                    </div>
                    
                    <h2 style="color: #dc3545; margin-top: 30px;">📅 Детали встречи</h2>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>📅 Дата:</strong> ${formattedDate}</p>
                        <p><strong>🕐 Время:</strong> ${appointmentData.appointment_time}</p>
                        ${appointmentData.timezone ? `<p><strong>🌐 Временная зона:</strong> ${appointmentData.timezone}</p>` : ''}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>This is an automated notification from the AstroForYou system</p>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"AstroForYou System" <${this.config.senderEmail}>`,
        to: this.config.adminEmail,
        subject: `🆕 Новая запись: ${appointmentData.name} - ${formattedDate}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true };

    } catch (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendSimpleTestEmail(testEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 [SIMPLE TEST] Sending simple test email to: ${testEmail}`);
      
      const mailOptions = {
        from: `"Test" <${this.config.senderEmail}>`,
        to: testEmail,
        subject: 'Simple Test Email',
        text: `This is a simple test email sent at ${new Date().toISOString()}`,
        html: `<p>This is a simple test email sent at ${new Date().toISOString()}</p>`
      };

      console.log(`📤 [SIMPLE TEST] Sending simple email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      console.log(`✅ [SIMPLE TEST] Simple email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [SIMPLE TEST] Error sending simple test email:', error);
      if (error instanceof Error) {
        console.error('❌ [SIMPLE TEST] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendTestEmail(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 [TEST EMAIL] Starting test email send to: ${this.config.adminEmail}`);
      
      const mailOptions = {
        from: `"AstroForYou Test" <${this.config.senderEmail}>`,
        to: this.config.adminEmail,
        subject: '🧪 Тест WHC.ca SMTP - AstroForYou',
        html: `
          <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: #28a745; color: white; padding: 30px; border-radius: 10px; text-align: center;">
                      <h1 style="margin: 0; font-size: 28px;">✅ Тест успешен!</h1>
                      <p style="margin: 10px 0 0 0; font-size: 18px;">WHC.ca SMTP работает корректно</p>
                  </div>
                  
                  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                      <h2 style="color: #28a745; margin-top: 0;">📊 Информация о подключении</h2>
                      
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                          <p><strong>📧 SMTP Сервер:</strong> ${this.config.smtpServer}</p>
                          <p><strong>🔌 Порт:</strong> ${this.config.smtpPort}</p>
                          <p><strong>📨 Отправитель:</strong> ${this.config.senderEmail}</p>
                          <p><strong>🔒 TLS:</strong> ${this.config.useTLS ? 'Включен' : 'Выключен'}</p>
                          <p><strong>🔒 SSL:</strong> ${this.config.useSSL ? 'Включен' : 'Выключен'}</p>
                      </div>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                      <p>Время отправки: ${new Date().toLocaleString('ru-RU')}</p>
                  </div>
                  
                  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
                    <p>Это тестовое сообщение системы AstroForYou.</p>
                    <p>
                      © 2025 AstroForYou. Все права защищены.<br>
                      Если у вас есть вопросы, свяжитесь с нами.
                    </p>
                  </div>
              </div>
          </body>
          </html>
        `,
      };

      console.log(`📤 [TEST EMAIL] Sending test email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      console.log(`✅ [TEST EMAIL] Test email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [TEST EMAIL] Error sending test email:', error);
      if (error instanceof Error) {
        console.error('❌ [TEST EMAIL] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendVideoEmail(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping video email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🎬 Your Video is Ready!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Hi ${firstName}! Here's your personalized video</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #2d5a2d; margin-top: 0;">📹 Watch Your Video Below</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center;">
                        <p style="margin-bottom: 20px; font-size: 16px;">Click the button below to watch your personalized video:</p>
                        <a href="${videoUrl}" style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            🎬 Watch Video
                        </a>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #2d5a2d; margin-top: 0;">💡 What You'll Discover:</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Personalized analysis of your situation</li>
                            <li>Concrete steps to solve your problems</li>
                            <li>Exclusive strategies and methods</li>
                            <li>Practical recommendations</li>
                        </ul>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>Best regards,<br>AstroForYou Team</p>
                    <p>If you have any questions, contact us at: ${this.config.senderEmail}</p>
                </div>
            </div>
        </body>
        </html>
      `;
      
      // Add unsubscribe footer
      htmlContent = emailPreferencesManager.addUnsubscribeFooter(htmlContent, email);

      const mailOptions = {
        from: `"Anna Raight" <${this.config.senderEmail}>`,
        to: email,
        subject: `🎬 Your personalized video is ready, ${firstName}!`,
        html: htmlContent,
      };

      console.log(`📧 [VIDEO EMAIL] Sending email with config:`, {
        server: this.config.smtpServer,
        port: this.config.smtpPort,
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        ssl: this.config.useSSL,
        tls: this.config.useTLS
      });

      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [VIDEO EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('Error sending video email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendAppointmentReminder(appointmentData: AppointmentData): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive reminder emails
      const canSend = await emailPreferencesManager.canSendEmail(appointmentData.email, 'reminder');
      if (!canSend) {
        console.log(`📧 Skipping reminder email to ${appointmentData.email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      const dateObj = new Date(appointmentData.appointment_date);
      const formattedDate = dateObj.toLocaleDateString('ru-RU');

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">⏰ Напоминание о встрече!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Ваша консультация скоро начнется</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #2d5a2d; margin-top: 0;">📅 Детали встречи</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>📅 Дата:</strong> ${formattedDate}</p>
                        <p><strong>🕐 Время:</strong> ${appointmentData.appointment_time}</p>
                        <p><strong>👤 Имя:</strong> ${appointmentData.name}</p>
                        <p><strong>📧 Email:</strong> ${appointmentData.email}</p>
                        <p><strong>📞 Телефон:</strong> ${appointmentData.phone}</p>
                        ${appointmentData.timezone ? `<p><strong>🌐 Временная зона:</strong> ${appointmentData.timezone}</p>` : ''}
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #856404; margin-top: 0;">⚠️ Важная информация:</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Встреча начнется через 1 час</li>
                            <li>Подготовьте вопросы заранее</li>
                            <li>Будьте готовы к встрече за 5 минут</li>
                            <li>Иметь под рукой данные о бизнесе</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #2d5a2d; margin-top: 0;">📋 Что будет на встрече:</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Анализ вашего бизнеса</li>
                            <li>Стратегия увеличения продаж</li>
                            <li>Практические рекомендации</li>
                            <li>Ответы на ваши вопросы</li>
                        </ul>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>С уважением,<br>Команда AstroForYou</p>
                    <p>Если у вас есть вопросы, свяжитесь с нами: ${this.config.senderEmail}</p>
                </div>
            </div>
        </body>
        </html>
      `;
      
      // Add unsubscribe footer
      htmlContent = emailPreferencesManager.addUnsubscribeFooter(htmlContent, appointmentData.email);

      const mailOptions = {
        from: `"Anna Raight" <${this.config.senderEmail}>`,
        to: appointmentData.email,
        subject: `⏰ Напоминание: встреча ${formattedDate} в ${appointmentData.appointment_time}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true };

    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendWelcomeEmail(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping welcome email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [WELCOME EMAIL] Sending to ${email}`);

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4A148C 0%, #7B1FA2 50%, #8E24AA 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 32px; margin-bottom: 10px;">Welcome to AstroForYou 🌌</h1>
                    <p style="margin: 0; font-size: 18px; opacity: 0.9;">Your video is here!</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Dear <strong>${firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Welcome to the AstroForYou family! 🌟
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        I'm Anna Raight, and I'm so excited you've decided to explore the world of scientific astrology with me.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                        As promised, here's the video you signed up to watch 👇
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="margin-bottom: 20px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #4A148C 0%, #7B1FA2 100%); color: white; padding: 3px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
                                🎥 EXCLUSIVE VIDEO
                            </div>
                        </div>
                        <a href="${videoUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255,107,53,0.3); transition: all 0.3s ease;">
                            👉 Watch your video now
                        </a>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #E8F5E8 0%, #F0F8F0 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #4CAF50;">
                        <h3 style="color: #2E7D32; margin-top: 0; margin-bottom: 15px; font-size: 20px;">In this video you'll discover:</h3>
                        <ul style="margin: 0; padding-left: 0; list-style: none;">
                            <li style="margin-bottom: 12px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; color: #FF6B35; font-size: 16px;">⭐</span>
                                <strong>The #1 reason most astrology feels "wrong"</strong> (and how to fix it)
                            </li>
                            <li style="margin-bottom: 12px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; color: #FF6B35; font-size: 16px;">⭐</span>
                                <strong>The secret method Russian scientists used</strong> to make astrology mathematical
                            </li>
                            <li style="margin-bottom: 0; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; color: #FF6B35; font-size: 16px;">⭐</span>
                                <strong>How I met my husband using astrological relocation</strong> (true story!)
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 15px;">
                    <p style="margin-bottom: 15px; font-size: 16px; font-style: italic; color: #666;">Cosmically yours,</p>
                    <p style="margin-bottom: 5px; font-size: 18px; font-weight: bold; color: #4A148C;">Anna Raight</p>
                    <p style="margin-bottom: 20px; font-size: 14px; color: #666;">Founder, AstroForYou Academy</p>
                    
                    <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
                        <p style="font-size: 14px; color: #666; margin: 0;">
                            <strong>P.S.</strong> Know someone who'd love this? Forward this email and share the cosmic awakening. ✨
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `;
      
      // Add unsubscribe footer
      htmlContent = emailPreferencesManager.addUnsubscribeFooter(htmlContent, email);

      const mailOptions = {
        from: `"Anna Raight" <${this.config.senderEmail}>`,
        to: email,
        subject: `Welcome to AstroForYou 🌌 Your video is here.`,
        html: htmlContent,
      };

      console.log(`📤 [WELCOME EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [WELCOME EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [WELCOME EMAIL] Error sending welcome email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendVideoReminderEmail(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping reminder email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [REMINDER EMAIL] Sending to ${email}`);

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2D1B69 0%, #4A148C 50%, #6A1B9A 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -30px; right: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -20px; left: -20px; width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 28px; margin-bottom: 8px;">🌙 Quick Reminder</h1>
                    <p style="margin: 0; font-size: 16px; opacity: 0.9;">Your cosmic training awaits</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Just a quick reminder — your training video is ready for you:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <a href="${videoUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                            👉 Watch your cosmic video here
                        </a>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Inside, I'll show you how scientific astrology (and our Reality Management method) gives you accurate, reliable guidance — the kind most people never experience with astrology.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                        And if you feel called to go deeper, there's a link on the page to schedule a personal call with me.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #FF9800;">
                        <p style="margin: 0; font-size: 15px; color: #E65100;">
                            <strong>P.S.</strong> This video is only available for a limited time — don't miss your chance to see how scientific astrology really works.
                        </p>
                        <div style="text-align: center; margin-top: 15px;">
                            <a href="${videoUrl}" style="display: inline-block; background: #FF9800; color: white; padding: 10px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px;">
                                👉 Watch now
                            </a>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 25px; padding: 20px; background: #f8f9fa; border-radius: 15px;">
                    <p style="margin-bottom: 10px; font-size: 16px; font-style: italic; color: #666;">Cosmically yours,</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #4A148C;">Anna 🌙</p>
                </div>
            </div>
        </body>
        </html>
      `;
      
      // Add unsubscribe footer
      htmlContent = emailPreferencesManager.addUnsubscribeFooter(htmlContent, email);

      const mailOptions = {
        from: `"Anna Raight" <${this.config.senderEmail}>`,
        to: email,
        subject: `🌙 Don't miss your cosmic training, ${firstName}`,
        html: htmlContent,
      };

      console.log(`📤 [REMINDER EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [REMINDER EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [REMINDER EMAIL] Error sending reminder email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendCheckingInEmail(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping checking-in email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [CHECKING-IN EMAIL] Sending to ${email}`);

      // Extract scheduling URL from video URL - replace /watch with /schedule
      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2D1B69 0%, #4A148C 50%, #6A1B9A 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -30px; right: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -20px; left: -20px; width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 28px; margin-bottom: 8px;">🌙 Did the video resonate with you?</h1>
                    <p style="margin: 0; font-size: 16px; opacity: 0.9;">Let's chat about what you learned</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${firstName}</strong> — it's Vladimir here.</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Anna asked me to check in personally and see if you had any questions about the video on scientific astrology and the Reality Management method.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Many people say it's the first time astrology has ever actually made sense for them — I'd love to hear what resonated with you most.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                        If you'd like, we can also set aside a few minutes to chat. I'll answer your questions directly and show you how you can start giving accurate, professional readings yourself.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <a href="${schedulingUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                            👉 Book a quick call with me here
                        </a>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Would today or tomorrow work better for you?
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 15px;">
                        Cosmically yours,<br>
                        <strong>Vladimir 🌙</strong>
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                        <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                            <strong>P.S.</strong> Here's the link again in case you missed it:
                        </p>
                        <div style="text-align: center;">
                            <a href="${schedulingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6A1B9A 0%, #4A148C 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px;">
                                Book your call here
                            </a>
                        </div>
                    </div>
                </div>
                
                ${emailPreferencesManager.addUnsubscribeFooter('', email)}
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `${this.config.senderEmail}`,
        to: email,
        subject: `Did the video resonate with you?`,
        html: htmlContent,
      };

      console.log(`📤 [CHECKING-IN EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [CHECKING-IN EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [CHECKING-IN EMAIL] Error sending checking-in email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendDirectOfferEmail(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping direct offer email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [DIRECT OFFER EMAIL] Sending to ${email}`);

      // Extract scheduling URL from video URL - replace /watch with /schedule
      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 32px; margin-bottom: 10px;">✨ Accurate readings</h1>
                    <p style="margin: 0; font-size: 20px; opacity: 0.95; font-weight: 500;">(copy & paste the method)</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        <strong>Want to give accurate, professional readings — without guessing or vague "horoscope talk"?</strong> Then keep reading…
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        I'll share the exact Reality Management formula — a mathematically structured approach developed by Russian scientist Dr. Sergey Shestopalov and his research team. It's been tested on <strong>23,281 charts</strong>, clinical archives, aerospace data, and even marriage registries… and it works with stunning precision.
                    </p>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
                        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #856404;">
                            All you have to do is copy & paste the formulas into your practice (or daily life).
                        </p>
                    </div>
                    
                    <p style="font-size: 18px; font-weight: bold; text-align: center; margin: 30px 0; color: #d32f2f;">
                        And if you don't start giving accurate readings within 7 months…<br>
                        YOU DON'T PAY.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Keep reading below and I'll show you…<br>
                        <strong>#1</strong> - How this works<br>
                        <strong>#2</strong> - Proof that it works
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <h3 style="color: #2D1B69; margin-top: 0;">First off, how it works…</h3>
                        
                        <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px;">
                            Traditional astrology often feels vague and contradictory. One astrologer says one thing, another — the opposite. It's subjective, not scientific.
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px;">
                            <strong>Dr. Shestopalov's method is completely different.</strong> It's a mathematically formalized, statistically proven system called the Formula of Events. By spotting recurring planetary patterns, you can predict future events before they happen — reliably and consistently.
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.8; margin-bottom: 0;">
                            And it's not just theory: this system has been honored by the European Medical Association, the Medical Royal Society of Belgium, and presented at the World Scientific Congress at the UN in Geneva.
                        </p>
                    </div>
                    
                    <h3 style="color: #2D1B69; margin-top: 30px;">I've seen it over and over and over again…</h3>
                    
                    <ul style="font-size: 16px; line-height: 1.8;">
                        <li style="margin-bottom: 15px;"><strong>Julia</strong>, one of my students, used the method to give a recovery roadmap to a client with early-stage cancer. The progression stopped, and he found hope again.</li>
                        <li style="margin-bottom: 15px;"><strong>Lera</strong>, a seamstress with no astrology background, became a certified practitioner in just months — today she earns her full-time living giving readings.</li>
                        <li style="margin-bottom: 15px;"><strong>Uliana</strong>, a complete beginner, now delivers premium forecasts at $250 each.</li>
                        <li style="margin-bottom: 15px;"><strong>Olga</strong>, a busy mom, studied during her toddler's naps — and within 4 months built a $1,000/month side income helping clients understand themselves.</li>
                        <li style="margin-bottom: 15px;"><strong>My own story</strong>: I used this method to relocate — which led to a career breakthrough in Los Angeles, and later, to meeting my husband in Australia.</li>
                    </ul>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50;">
                        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #2e7d32;">
                            Bottom line: it works. And it works consistently.
                        </p>
                    </div>
                    
                    <p style="font-size: 17px; line-height: 1.8; margin-bottom: 25px; text-align: center; font-weight: 500;">
                        That's why I can confidently say: if you don't start giving accurate readings and seeing clear results within 7 months, you don't pay.
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 6px 20px rgba(0,0,0,0.15);">
                        <a href="${schedulingUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                            👉 Click here and book a call
                        </a>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px; text-align: center;">
                        There's no pressure. If it's not for you, we won't waste your time.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; text-align: center;">
                        But if you're ready to finally see how astrology really works — this is your moment.
                    </p>
                    
                    <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                        Sounds good?
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; text-align: center;">
                        Then <a href="${schedulingUrl}" style="color: #FF6B35; font-weight: bold;">click this link here</a> and book a call on the next page.
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 0;">
                        Cosmically yours,<br>
                        <strong>Anna Raight 🌙</strong><br>
                        <em>Founder, AstroForYou Academy</em>
                    </p>
                </div>
                
                ${emailPreferencesManager.addUnsubscribeFooter('', email)}
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `${this.config.senderEmail}`,
        to: email,
        subject: `✨ Accurate readings (copy & paste the method)`,
        html: htmlContent,
      };

      console.log(`📤 [DIRECT OFFER EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [DIRECT OFFER EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [DIRECT OFFER EMAIL] Error sending direct offer email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendFinalReminderEmail(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping final reminder email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [FINAL REMINDER EMAIL] Sending to ${email}`);

      // Extract scheduling URL from video URL - replace /watch with /schedule
      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2D1B69 0%, #4A148C 50%, #6A1B9A 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 28px; margin-bottom: 10px;">🌙 LAST REMINDER</h1>
                    <p style="margin: 0; font-size: 18px; opacity: 0.95; font-weight: 500;">Read if you want accurate readings</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>, it's Anna again :)</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Just wanted to bump this one last time to make sure you've seen the offer.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        The original review is copied below. I'd also recommend you check out what my student Uliana achieved after becoming a certified practitioner. She went from working as an accountant to building a full-time astrology practice in just a year — helping clients transform their lives while working from home.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">👉 You can read her review here:</p>
                        <img src="cid:photo1" alt="Uliana's Review" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">
                    </div>
                    
                    <p style="font-size: 16px; margin-bottom: 25px; text-align: center;">
                        Talk soon,<br>
                        <strong>Anna 🌙</strong>
                    </p>
                    
                    <div style="border-top: 2px solid #e9ecef; margin: 30px 0; padding-top: 25px;">
                        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                            <h3 style="color: #2D1B69; margin-top: 0; font-size: 20px;">Want to give accurate, professional readings? Then keep reading…</h3>
                            
                            <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px;">
                                We'll share with you the exact Reality Management system — a scientifically recognized, mathematically proven method of predictive astrology.
                            </p>
                            
                            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                                <p style="font-size: 16px; font-weight: bold; margin: 0; color: #856404;">
                                    All you have to do is copy & paste the formulas into your practice.
                                </p>
                            </div>
                            
                            <p style="font-size: 17px; font-weight: bold; text-align: center; margin: 25px 0; color: #d32f2f;">
                                And if you don't start giving accurate readings within 7 months…<br>
                                YOU DON'T PAY.
                            </p>
                            
                            <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                                Here's what you'll see inside:<br>
                                <strong>#1</strong> — How it works<br>
                                <strong>#2</strong> — Proof that it works
                            </p>
                            
                            <h4 style="color: #2D1B69; margin-top: 25px;">How it works</h4>
                            
                            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 15px;">
                                For over 20 years, Russian mathematician and astrologer Dr. Sergey Shestopalov refined this method using 23,281 birth charts, clinical archives, aerospace performance data, and even marriage registries.
                            </p>
                            
                            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px;">
                                The result is a mathematical model of astrology — not guesswork, not vague symbolism. It predicts life events with stunning accuracy, and it's the only system in the world recognized by the international scientific community.
                            </p>
                            
                            <h4 style="color: #2D1B69; margin-top: 25px;">Proof that it works…</h4>
                            
                            <ul style="font-size: 15px; line-height: 1.7; padding-left: 20px;">
                                <li style="margin-bottom: 10px;"><strong>Julia:</strong> helped a client with early-stage cancer create a recovery strategy — the progression stopped.</li>
                                <li style="margin-bottom: 10px;"><strong>Uliana:</strong> a total beginner, now delivers $250 premium forecasts after certification.</li>
                                <li style="margin-bottom: 10px;"><strong>Olga:</strong> busy mom, built a $1,000/month side income in 4 months while studying during toddler naps.</li>
                                <li style="margin-bottom: 10px;"><strong>My story:</strong> using this system, I relocated to Los Angeles (career breakthrough) and later to Australia (where I met my husband).</li>
                            </ul>
                            
                            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                                <p style="font-size: 16px; font-weight: bold; margin: 0; color: #2e7d32; text-align: center;">
                                    Bottom line: it works.
                                </p>
                            </div>
                            
                            <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; text-align: center;">
                                That's why I can confidently say: if you don't start giving accurate readings and getting results in your life within 7 months — you don't pay.
                            </p>
                            
                            <p style="font-size: 17px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                                Sounds good?
                            </p>
                            
                            <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; text-align: center;">
                                So if you want more info on how this all works…
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${schedulingUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                                    👉 Click here and book a call
                                </a>
                            </div>
                            
                            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 0; text-align: center; color: #666;">
                                No pressure. If it's not right for you, we won't waste your time. But if you're ready to finally see how astrology really works… this is your moment.
                            </p>
                        </div>
                    </div>
                    
                    <p style="font-size: 16px; margin-bottom: 0; margin-top: 30px;">
                        Cosmically yours,<br>
                        <strong>Anna Raight 🌙</strong><br>
                        <em>Founder, AstroForYou Academy</em>
                    </p>
                </div>
                
                ${emailPreferencesManager.addUnsubscribeFooter('', email)}
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `${this.config.senderEmail}`,
        to: email,
        subject: `🌙 LAST REMINDER: Read if you want accurate readings`,
        html: htmlContent,
        attachments: [
          {
            filename: 'photo1.png',
            path: process.cwd() + '/public/photo1.png',
            cid: 'photo1'
          }
        ]
      };

      console.log(`📤 [FINAL REMINDER EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [FINAL REMINDER EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [FINAL REMINDER EMAIL] Error sending final reminder email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendTestimonial1Email(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping testimonial 1 email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [TESTIMONIAL 1 EMAIL] Sending to ${email}`);

      // Extract scheduling URL from video URL - replace /watch with /schedule
      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2D1B69 0%, #4A148C 50%, #6A1B9A 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 28px; margin-bottom: 10px;">🌙 Confusing horoscopes?</h1>
                    <p style="margin: 0; font-size: 18px; opacity: 0.95; font-weight: 500;">Read this…</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        <strong>Question</strong> — have you ever felt frustrated with astrology?
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        One astrologer says one thing, another says the opposite… One month your "lucky" period feels like anything but… And when you need real answers, the horoscope is just too vague to be useful.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; font-style: italic; color: #666;">
                        It's like you're trapped in an endless cycle of hope → confusion → disappointment.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        All you really want is <strong>clarity</strong>. <strong>Predictability</strong>. <strong>Guidance you can actually trust</strong>.
                    </p>
                    
                    <p style="font-size: 17px; line-height: 1.8; margin-bottom: 20px; font-weight: bold;">
                        Is that too much to ask?
                    </p>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
                        <p style="font-size: 18px; font-weight: bold; margin: 0; color: #2e7d32;">
                            The answer is NO — it's NOT too much.
                        </p>
                        <p style="font-size: 16px; margin: 10px 0 0 0; color: #2e7d32;">
                            And it IS possible.
                        </p>
                    </div>
                    
                    <p style="font-size: 17px; line-height: 1.8; margin-bottom: 15px; font-weight: bold;">
                        The formula is simple:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin: 10px 0; padding-left: 20px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">1.</span>
                            A precise, scientific method (not guesswork)
                        </p>
                        <p style="font-size: 16px; margin: 10px 0; padding-left: 20px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">2.</span>
                            A step-by-step system anyone can learn
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        That's exactly what happened to <strong>Irina</strong>, one of my students.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        She worked as a notary assistant, brand new to astrology. Within just 13 months of learning our Reality Management system, she became a certified practitioner.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Now she gives accurate, professional readings, helps dozens of clients transform their lives, and earns her full-time living through astrology — all while working from home.
                    </p>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
                        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #856404; text-align: center;">
                            Her old confusion is gone. She has clarity, purpose, and freedom.
                        </p>
                    </div>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <img src="cid:photo2" alt="Irina's Review" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;">
                        <p style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">
                            👉 You can see her review here
                        </p>
                        <a href="https://youtu.be/xHfOOQSTdCs" style="color: #FF6B35; font-weight: bold; font-size: 16px; text-decoration: none;">
                            https://youtu.be/xHfOOQSTdCs
                        </a>
                    </div>
                    
                    <p style="font-size: 17px; line-height: 1.8; margin-bottom: 25px; font-weight: bold; text-align: center;">
                        Now it's your turn. Stop guessing, stop doubting — start giving accurate readings that actually change lives.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${schedulingUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                            👉 Book your call now
                        </a>
                    </div>
                    
                    <p style="font-size: 16px; margin-bottom: 0; margin-top: 30px;">
                        Cosmically yours,<br>
                        <strong>Anna Raight 🌙</strong><br>
                        <em>Founder, AstroForYou Academy</em>
                    </p>
                </div>
                
                ${emailPreferencesManager.addUnsubscribeFooter('', email)}
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `${this.config.senderEmail}`,
        to: email,
        subject: `🌙 Confusing horoscopes? Read this…`,
        html: htmlContent,
        attachments: [
          {
            filename: 'photo2.png',
            path: process.cwd() + '/public/photo2.png',
            cid: 'photo2'
          }
        ]
      };

      console.log(`📤 [TESTIMONIAL 1 EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [TESTIMONIAL 1 EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [TESTIMONIAL 1 EMAIL] Error sending testimonial 1 email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendTestimonial2Email(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping testimonial 2 email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [TESTIMONIAL 2 EMAIL] Sending to ${email}`);

      // Extract scheduling URL from video URL - replace /watch with /schedule
      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2D1B69 0%, #4A148C 50%, #6A1B9A 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 28px; margin-bottom: 10px;">🌙 Integrity in astrology</h1>
                    <p style="margin: 0; font-size: 18px; opacity: 0.95; font-weight: 500;">= real healing</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        It doesn't matter how inspiring an astrology session sounds… <strong>If it doesn't create real change in people's lives.</strong>
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                        That's why at AstroForYou Academy, we focus on <strong>BOTH</strong>:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin: 10px 0; padding-left: 25px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                            Accuracy and reliability
                        </p>
                        <p style="font-size: 16px; margin: 10px 0; padding-left: 25px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                            Integrity and true service
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Because for me, astrology isn't about selling illusions.
                    </p>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
                        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #2e7d32;">
                            It's about helping people find clarity, hope, and transformation — backed by science.
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Take <strong>Julia</strong>, one of my students.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        She had a client with early-stage cancer who had completely lost hope. Nothing seemed to help.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        But Julia used the Reality Management method to create a recovery strategy based on his unique chart. And once he followed it… <strong>the cancer stopped progressing.</strong>
                    </p>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
                        <p style="font-size: 16px; margin: 0; color: #856404;">
                            It was incredible. Not just an accurate prediction — but a <strong>life-changing intervention</strong> that gave him back his hope for the future.
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                        And Julia? She realized she could truly change lives as an astrologer — with confidence, integrity, and a proven method.
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">
                            👉 You can see Julia's full story here:
                        </p>
                        
                        <div style="margin: 20px 0;">
                            <img src="cid:photo3" alt="Julia's Review Part 1" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px;">
                        </div>
                        
                        <div style="margin: 20px 0;">
                            <img src="cid:photo4" alt="Julia's Review Part 2" style="max-width: 100%; height: auto; border-radius: 8px;">
                        </div>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        And if Julia's story resonates with you… imagine what could happen if you followed the same path.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                        You don't need years of trial and error. You just need a proven system — and the right guidance.
                    </p>
                    
                    <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #2196f3;">
                        <p style="font-size: 16px; line-height: 1.8; margin: 0; color: #1976d2;">
                            That's exactly what we'll talk about on a short call together. I'll answer your questions, show you how the Reality Management system works, and help you see if this is the right path for you.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${schedulingUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                            👉 Click here to book your call now
                        </a>
                    </div>
                    
                    <p style="font-size: 16px; margin-bottom: 0; margin-top: 30px;">
                        Cosmically yours,<br>
                        <strong>Anna Raight 🌙</strong><br>
                        <em>Founder, AstroForYou Academy</em>
                    </p>
                </div>
                
                ${emailPreferencesManager.addUnsubscribeFooter('', email)}
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `${this.config.senderEmail}`,
        to: email,
        subject: `🌙 Integrity in astrology = real healing`,
        html: htmlContent,
        attachments: [
          {
            filename: 'photo3.png',
            path: process.cwd() + '/public/photo3.png',
            cid: 'photo3'
          },
          {
            filename: 'photo4.png',
            path: process.cwd() + '/public/photo4.png',
            cid: 'photo4'
          }
        ]
      };

      console.log(`📤 [TESTIMONIAL 2 EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [TESTIMONIAL 2 EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [TESTIMONIAL 2 EMAIL] Error sending testimonial 2 email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendTestimonial3Email(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping testimonial 3 email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [TESTIMONIAL 3 EMAIL] Sending to ${email}`);

      // Extract scheduling URL from video URL - replace /watch with /schedule
      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2D1B69 0%, #4A148C 50%, #6A1B9A 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 28px; margin-bottom: 10px;">🌙 Copy your way to</h1>
                    <p style="margin: 0; font-size: 18px; opacity: 0.95; font-weight: 500;">accurate readings, ${firstName}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Want to start giving accurate, professional readings?
                    </p>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
                        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #2e7d32;">
                            Here's the secret…
                        </p>
                    </div>
                    
                    <p style="font-size: 17px; line-height: 1.8; margin-bottom: 25px; font-weight: bold; text-align: center;">
                        Don't try to reinvent astrology — just copy what already works.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        That's exactly what <strong>Olga</strong> did.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        When she came to us, her main request was simple: "I want to find my purpose." She had already studied at another astrology school, but still felt lost — unsure of her direction, her strengths, and how to help others.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Inside the Reality Management system, Olga finally discovered clarity. She learned that every person can manage their reality almost without limits, as long as they understand how the past influences the present, and the present shapes the future.
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin-bottom: 20px; font-weight: bold;">
                            After completing just five courses, Olga can now:
                        </p>
                        
                        <ul style="font-size: 15px; line-height: 1.7; padding-left: 0; list-style: none;">
                            <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                                Confidently analyze natal charts
                            </li>
                            <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                                Identify strengths, weaknesses, and life lessons
                            </li>
                            <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                                Provide career and relationship guidance
                            </li>
                            <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                                Even determine compatibility for love or business partnerships
                            </li>
                        </ul>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
                        <p style="font-size: 16px; margin: 0; color: #856404; font-style: italic;">
                            Her words? "Now I know exactly who I am, what I want — and I don't need magical rituals for this. Astrology answered all my questions and even more."
                        </p>
                    </div>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">
                            👉 You can watch Olga's full testimonial here:
                        </p>
                        
                        <a href="https://youtu.be/8GgbPhjEeIo" style="color: #FF6B35; font-weight: bold; font-size: 16px; text-decoration: none; display: block; margin-bottom: 20px;">
                            https://youtu.be/8GgbPhjEeIo
                        </a>
                        
                        <div style="margin: 20px 0;">
                            <img src="cid:photo5" alt="Olga's Review" style="max-width: 100%; height: auto; border-radius: 8px;">
                        </div>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Olga stopped "floating in the clouds." She gained clarity, confidence, and purpose — and she's now part of the AstroForYou Academy team, helping others find the same transformation.
                    </p>
                    
                    <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #2196f3;">
                        <p style="font-size: 17px; line-height: 1.8; margin: 0; color: #1976d2; font-weight: bold; text-align: center;">
                            And that's the power of Reality Management. No guesswork. No endless trial and error. Just a proven method that anyone can copy — and see real results.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${schedulingUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                            👉 Click here to book your call now
                        </a>
                    </div>
                    
                    <p style="font-size: 16px; margin-bottom: 0; margin-top: 30px;">
                        Cosmically yours,<br>
                        <strong>Anna Raight 🌙</strong><br>
                        <em>Founder, AstroForYou Academy</em>
                    </p>
                </div>
                
                ${emailPreferencesManager.addUnsubscribeFooter('', email)}
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `${this.config.senderEmail}`,
        to: email,
        subject: `🌙 Copy your way to accurate readings, ${firstName}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'photo5.png',
            path: process.cwd() + '/public/photo5.png',
            cid: 'photo5'
          }
        ]
      };

      console.log(`📤 [TESTIMONIAL 3 EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [TESTIMONIAL 3 EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [TESTIMONIAL 3 EMAIL] Error sending testimonial 3 email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendContent1Email(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping content 1 email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [CONTENT 1 EMAIL] Sending to ${email}`);

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2D1B69 0%, #4A148C 50%, #6A1B9A 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 28px; margin-bottom: 10px;">🌌 My secret to</h1>
                    <p style="margin: 0; font-size: 18px; opacity: 0.95; font-weight: 500;">accurate predictions</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        Want to know the real secret behind astrology that actually works?
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin: 10px 0; text-align: center; color: #666;">
                            It's not memorizing symbols…<br>
                            It's not intuition…<br>
                            And it's not reading generic horoscopes.
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        It's a simple "tweak" in how you approach astrology —
                    </p>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107; text-align: center;">
                        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #856404;">
                            one that instantly makes your readings more accurate, reliable, and life-changing.
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px; font-weight: bold;">
                        So you can finally:
                    </p>
                    
                    <ul style="font-size: 15px; line-height: 1.7; padding-left: 0; list-style: none; margin-bottom: 25px;">
                        <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                            Give clients clarity instead of confusion
                        </li>
                        <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                            Predict events with confidence
                        </li>
                        <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                            And use astrology to create real transformation in their lives (and yours)
                        </li>
                    </ul>
                    
                    <p style="font-size: 17px; line-height: 1.8; margin-bottom: 20px; font-weight: bold;">
                        So what is this secret?
                    </p>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
                        <p style="font-size: 18px; font-weight: bold; margin: 0; color: #2e7d32;">
                            I call it "the missing link in astrology."
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 15px;">
                        And, honestly…
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        It's not so much a secret as it is a law of the cosmos.
                    </p>
                    
                    <div style="background: #f8d7da; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #dc3545;">
                        <p style="font-size: 16px; margin: 0; color: #721c24;">
                            Because if you ignore it…<br>
                            <strong>Your predictions will always feel inconsistent, even random.</strong>
                        </p>
                    </div>
                    
                    <div style="background: #d1ecf1; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #17a2b8;">
                        <p style="font-size: 16px; margin: 0; color: #0c5460;">
                            But when you follow it…<br>
                            <strong>Astrology becomes scientific, precise, and shockingly accurate.</strong>
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                        I've put together a short video where I explain exactly what this "missing link" is — and how you can apply it right now, even if you're new to astrology.
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <a href="${videoUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                                👉 Click here to watch the video
                            </a>
                        </div>
                        
                        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #6c757d;">
                            <p style="font-size: 14px; color: #6c757d; margin: 0; font-style: italic;">
                                [SCREENSHOT OF VIDEO]<br>
                                <em>Video preview will be displayed here</em>
                            </p>
                        </div>
                    </div>
                    
                    <p style="font-size: 16px; margin-bottom: 0; margin-top: 30px;">
                        Cosmically yours,<br>
                        <strong>Anna Raight 🌙</strong><br>
                        <em>Founder, AstroForYou Academy</em>
                    </p>
                </div>
                
                ${emailPreferencesManager.addUnsubscribeFooter('', email)}
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `${this.config.senderEmail}`,
        to: email,
        subject: `🌌 My secret to accurate predictions`,
        html: htmlContent,
      };

      console.log(`📤 [CONTENT 1 EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [CONTENT 1 EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [CONTENT 1 EMAIL] Error sending content 1 email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendContent2Email(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can receive marketing emails
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping content 2 email to ${email} - user unsubscribed`);
        return { success: true }; // Return success to avoid breaking the flow
      }

      console.log(`📧 [CONTENT 2 EMAIL] Sending to ${email}`);

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2D1B69 0%, #4A148C 50%, #6A1B9A 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <h1 style="margin: 0; font-size: 28px; margin-bottom: 10px;">🌌 [VIDEO] Step-by-step</h1>
                    <p style="margin: 0; font-size: 18px; opacity: 0.95; font-weight: 500;">astrology tutorial</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-top: 20px;">
                    <p style="font-size: 18px; margin-bottom: 25px;">Hi <strong>${firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        I've just put together a short video that shows you step-by-step how to start giving accurate, reliable readings using the Reality Management method.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                        In the video, I pull back the curtain on everything…
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <ul style="font-size: 15px; line-height: 1.7; padding-left: 0; list-style: none; margin: 0;">
                            <li style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                                The core formulas that make astrology scientific
                            </li>
                            <li style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                                How to apply them to real charts (even as a beginner)
                            </li>
                            <li style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                                How to avoid the #1 mistake that makes most predictions fail
                            </li>
                            <li style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                                <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">✨</span>
                                And how to start giving readings that truly transform lives
                            </li>
                        </ul>
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
                        <p style="font-size: 17px; font-weight: bold; margin: 0; color: #2e7d32;">
                            All step by step.
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                        If you can spare a few minutes to watch it, I guarantee it will help you:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin: 10px 0; padding-left: 25px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">#1</span>
                            understand astrology in a way that finally makes sense
                        </p>
                        <p style="font-size: 16px; margin: 10px 0; padding-left: 25px; position: relative;">
                            <span style="position: absolute; left: 0; font-weight: bold; color: #FF6B35;">#2</span>
                            start using it to make better decisions (and help others too)
                        </p>
                    </div>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <a href="${videoUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(255,107,53,0.3);">
                                👉 Click here to watch the video now
                            </a>
                        </div>
                        
                        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px dashed #6c757d;">
                            <p style="font-size: 14px; color: #6c757d; margin: 0; font-style: italic;">
                                [SCREENSHOT OF VIDEO]<br>
                                <em>Step-by-step tutorial preview</em>
                            </p>
                        </div>
                    </div>
                    
                    <p style="font-size: 16px; margin-bottom: 0; margin-top: 30px;">
                        Cosmically yours,<br>
                        <strong>Anna Raight 🌙</strong><br>
                        <em>Founder, AstroForYou Academy</em>
                    </p>
                </div>
                
                ${emailPreferencesManager.addUnsubscribeFooter('', email)}
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `${this.config.senderEmail}`,
        to: email,
        subject: `🌌 [VIDEO] Step-by-step astrology tutorial`,
        html: htmlContent,
      };

      console.log(`📤 [CONTENT 2 EMAIL] Sending email...`);
      const sendResult = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [CONTENT 2 EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [CONTENT 2 EMAIL] Error sending content 2 email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendInvoiceEmail(invoiceData: {
    invoice_number: string;
    email: string;
    name?: string;
    total_amount: number;
    currency: string;
    due_date?: string;
    invoice_url: string;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    notes?: string;
    image_url?: string;
    post_payment_content?: string;
    post_payment_content_enabled?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 [INVOICE EMAIL] Starting send process for ${invoiceData.email}`);
      console.log(`📧 [INVOICE EMAIL] Invoice: ${invoiceData.invoice_number}, Amount: ${invoiceData.total_amount} ${invoiceData.currency}`);
      
      // Check if user can receive marketing emails (treating invoice as marketing)
      const canSend = await emailPreferencesManager.canSendEmail(invoiceData.email, 'marketing');
      if (!canSend) {
        console.log(`📧 [INVOICE EMAIL] Skipping - user unsubscribed: ${invoiceData.email}`);
        return { success: true }; // Return success to avoid breaking the flow
      }
      
      console.log(`✅ [INVOICE EMAIL] User can receive emails: ${invoiceData.email}`);
      
      // Log image info for debugging
      if (invoiceData.image_url) {
        console.log(`🖼️ [INVOICE EMAIL] Image URL: ${invoiceData.image_url}`);
        console.log(`🔗 [INVOICE EMAIL] Base URL: ${process.env.NEXT_PUBLIC_BASE_URL}`);
        console.log(`🌐 [INVOICE EMAIL] Full image URL: ${process.env.NEXT_PUBLIC_BASE_URL}${invoiceData.image_url}`);
      }

      const formattedDueDate = invoiceData.due_date 
        ? new Date(invoiceData.due_date).toLocaleDateString('ru-RU')
        : null;

      let htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">💰 Счет к оплате</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Привет${invoiceData.name ? `, ${invoiceData.name}` : ''}! Вам выставлен счет</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #2d5a2d; margin-top: 0;">📋 Детали счета</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>📄 Номер счета:</strong> ${invoiceData.invoice_number}</p>
                        <p><strong>💰 Сумма к оплате:</strong> ${invoiceData.total_amount.toFixed(2)} ${invoiceData.currency}</p>
                        ${formattedDueDate ? `<p><strong>📅 Срок оплаты:</strong> ${formattedDueDate}</p>` : ''}
                        <p><strong>📧 Email:</strong> ${invoiceData.email}</p>
                    </div>

                    ${invoiceData.image_url ? `
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center;">
                        <p style="color: #666; margin-bottom: 10px;">📸 Изображение товара/услуги:</p>
                        <img src="${process.env.NEXT_PUBLIC_BASE_URL}${invoiceData.image_url}" 
                             alt="Invoice image" 
                             style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: block; margin: 0 auto;" />
                        <p style="color: #999; font-size: 12px; margin-top: 10px;">
                            Если изображение не отображается, <a href="${process.env.NEXT_PUBLIC_BASE_URL}${invoiceData.image_url}" style="color: #667eea;">нажмите здесь</a>
                        </p>
                    </div>
                    ` : ''}

                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #2d5a2d; margin-top: 0;">🛍️ Что включено:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <th style="text-align: left; padding: 8px;">Описание</th>
                                    <th style="text-align: center; padding: 8px;">Кол-во</th>
                                    <th style="text-align: right; padding: 8px;">Цена</th>
                                    <th style="text-align: right; padding: 8px;">Сумма</th>
                                </tr>
                            </thead>
                            <tbody>
      `;

      // Add invoice items
      invoiceData.items.forEach(item => {
        htmlContent += `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 8px;">${item.description}</td>
                                    <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                                    <td style="text-align: right; padding: 8px;">${item.unit_price.toFixed(2)} ${invoiceData.currency}</td>
                                    <td style="text-align: right; padding: 8px; font-weight: bold;">${item.total_price.toFixed(2)} ${invoiceData.currency}</td>
                                </tr>
        `;
      });

      htmlContent += `
                            </tbody>
                            <tfoot>
                                <tr style="border-top: 2px solid #2d5a2d; font-weight: bold;">
                                    <td colspan="3" style="text-align: right; padding: 12px;">ИТОГО:</td>
                                    <td style="text-align: right; padding: 12px; font-size: 18px;">${invoiceData.total_amount.toFixed(2)} ${invoiceData.currency}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    ${invoiceData.notes ? `
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #856404; margin-top: 0;">📝 Дополнительные заметки:</h3>
                        <p style="margin: 0;">${invoiceData.notes}</p>
                    </div>
                    ` : ''}

                    ${invoiceData.post_payment_content_enabled && invoiceData.post_payment_content ? `
                    <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6cb;">
                        <h3 style="color: #155724; margin-top: 0;">🎁 Что вы получите после оплаты:</h3>
                        <p style="color: #155724; margin: 0; white-space: pre-line;">${invoiceData.post_payment_content}</p>
                    </div>
                    ` : ''}

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${invoiceData.invoice_url}" style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            💳 Оплатить счет онлайн
                        </a>
                    </div>

                    <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #0c5460; margin-top: 0;">ℹ️ Как оплатить:</h3>
                        <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460;">
                            <li>Нажмите кнопку "Оплатить счет онлайн"</li>
                            <li>Введите данные банковской карты</li>
                            <li>Подтвердите платеж</li>
                            <li>Получите подтверждение об оплате</li>
                        </ul>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>С уважением,<br>Команда AstroForYou</p>
                    <p>Если у вас есть вопросы, свяжитесь с нами: ${this.config.senderEmail}</p>
                </div>
            </div>
        </body>
        </html>
      `;

      // Add unsubscribe footer
      htmlContent = emailPreferencesManager.addUnsubscribeFooter(htmlContent, invoiceData.email);

      const mailOptions = {
        from: `"AstroForYou Billing" <${this.config.senderEmail}>`,
        to: invoiceData.email,
        subject: `💰 Счет ${invoiceData.invoice_number} к оплате - ${invoiceData.total_amount.toFixed(2)} ${invoiceData.currency}`,
        html: htmlContent,
      };

      console.log(`📤 [INVOICE EMAIL] Sending email with options:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        htmlLength: htmlContent.length
      });

      const sendResult = await this.transporter.sendMail(mailOptions);
      console.log(`✅ [INVOICE EMAIL] Email sent successfully:`, {
        messageId: sendResult.messageId,
        accepted: sendResult.accepted,
        rejected: sendResult.rejected,
        response: sendResult.response
      });

      return { success: true };

    } catch (error) {
      console.error('❌ [INVOICE EMAIL] Error sending invoice email:', error);
      if (error instanceof Error) {
        console.error('❌ [INVOICE EMAIL] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export the class for dynamic imports
export { WHCEmailManager };

// Export singleton instance
export const whcEmailManager = new WHCEmailManager();

// Export configuration helper
export const getWHCEmailConfig = (): WHCEmailConfig => ({
  smtpServer: process.env.WHC_SMTP_SERVER || 'mail.yourdomain.com',
  smtpPort: parseInt(process.env.WHC_SMTP_PORT || '465'),
  senderEmail: process.env.WHC_SENDER_EMAIL || 'noreply@yourdomain.com',
  senderPassword: process.env.WHC_SENDER_PASSWORD || '',
  useTLS: process.env.WHC_USE_TLS === 'true',
  useSSL: process.env.WHC_USE_SSL === 'true',
  adminEmail: process.env.WHC_ADMIN_EMAIL || 'admin@yourdomain.com',
}); 