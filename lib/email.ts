import nodemailer from 'nodemailer';

export interface EmailConfig {
  smtpServer: string;
  smtpPort: number;
  senderEmail: string;
  senderPassword: string;
  useTLS: boolean;
  adminEmail: string;
}

export interface AppointmentData {
  name: string;
  email: string;
  phone: string;
  website: string;
  revenue: string;
  appointment_date: string;
  appointment_time: string;
  timezone?: string;
  google_meet_link?: string;
  meeting_id?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
}

class EmailManager {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    // Use WHC.ca SMTP config from environment variables
    this.config = config || {
      smtpServer: process.env.WHC_SMTP_SERVER || 'mail.atemabio.com',
      smtpPort: parseInt(process.env.WHC_SMTP_PORT || '465'),
      senderEmail: process.env.WHC_SENDER_EMAIL || 'hello@atemabio.com',
      senderPassword: process.env.WHC_SENDER_PASSWORD || '',
      useTLS: process.env.WHC_USE_TLS === 'true',
      adminEmail: process.env.WHC_ADMIN_EMAIL || 'hello@atemabio.com',
    };
    
    this.transporter = nodemailer.createTransport({
      host: this.config.smtpServer,
      port: this.config.smtpPort,
      secure: this.config.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: this.config.senderEmail,
        pass: this.config.senderPassword,
      },
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 30000,     // 30 seconds
      tls: {
        rejectUnauthorized: false, // Only for development
        minVersion: 'TLSv1',
        ciphers: 'ALL'
      }
    });
  }

  // Test connection method
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      console.error('Email connection test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendAppointmentConfirmation(appointmentData: AppointmentData): Promise<{ success: boolean; error?: string }> {
    try {
      const dateObj = new Date(appointmentData.appointment_date);
      const formattedDate = dateObj.toLocaleDateString('ru-RU');

      const htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🎉 Запись подтверждена!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Ваша консультация успешно забронирована</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #2d5a2d; margin-top: 0;">📅 Детали встречи</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>📅 Дата:</strong> ${formattedDate}</p>
                        <p><strong>🕐 Время:</strong> ${appointmentData.appointment_time} (МСК)</p>
                        <p><strong>👤 Имя:</strong> ${appointmentData.name}</p>
                        <p><strong>📧 Email:</strong> ${appointmentData.email}</p>
                        <p><strong>📞 Телефон:</strong> ${appointmentData.phone}</p>
                        ${appointmentData.timezone ? `<p><strong>🌐 Временная зона:</strong> ${appointmentData.timezone}</p>` : ''}
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
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #856404; margin-top: 0;">⚠️ Важная информация:</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Встреча пройдет в Google Meet</li>
                            <li>Продолжительность: 60 минут</li>
                            <li>Подготовьте вопросы заранее</li>
                        </ul>
                    </div>
                    
                    ${appointmentData.google_meet_link ? `
                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #1976d2; margin-top: 0;">🎥 Google Meet</h3>
                        <p style="margin: 10px 0;">
                            <strong>Ссылка на встречу:</strong><br>
                            <a href="${appointmentData.google_meet_link}" 
                               style="color: #1976d2; text-decoration: none; font-weight: bold; word-break: break-all;">
                                ${appointmentData.google_meet_link}
                            </a>
                        </p>
                        ${appointmentData.meeting_id ? `<p style="margin: 10px 0; font-size: 14px; color: #666;">Meeting ID: ${appointmentData.meeting_id}</p>` : ''}
                    </div>
                    ` : ''}
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <p style="margin: 0; color: #666;">
                        Если у вас есть вопросы, свяжитесь с нами:<br>
                        📧 support@example.com<br>
                        📞 +7 (999) 123-45-67
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"AstroForYou" <${this.config.senderEmail}>`,
        to: appointmentData.email,
        subject: '✅ Подтверждение записи на консультацию - AstroForYou',
        html: htmlContent,
      };

      console.log('📧 Отправка подтверждения записи:');
      console.log('От:', mailOptions.from);
      console.log('Кому:', mailOptions.to);
      console.log('Тема:', mailOptions.subject);

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Appointment confirmation sent to ${appointmentData.email}`);
      console.log('Message ID:', result.messageId);
      console.log('Response:', result.response);
      
      return { success: true };

    } catch (error) {
      console.error('Error sending appointment confirmation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendAppointmentReminder(appointmentData: AppointmentData): Promise<{ success: boolean; error?: string }> {
    try {
      const dateObj = new Date(appointmentData.appointment_date);
      const formattedDate = dateObj.toLocaleDateString('ru-RU');

      const htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">⏰ Напоминание о встрече</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Завтра у вас запланирована консультация</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #2d5a2d; margin-top: 0;">📅 Детали встречи</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>📅 Дата:</strong> ${formattedDate}</p>
                        <p><strong>🕐 Время:</strong> ${appointmentData.appointment_time} (МСК)</p>
                        <p><strong>👤 Имя:</strong> ${appointmentData.name}</p>
                        ${appointmentData.timezone ? `<p><strong>🌐 Временная зона:</strong> ${appointmentData.timezone}</p>` : ''}
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #2d5a2d; margin-top: 0;">✅ Подготовка к встрече:</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Проверьте стабильность интернета</li>
                            <li>Подготовьте вопросы</li>
                            <li>Найдите тихое место для разговора</li>
                            <li>Будьте готовы к записи</li>
                        </ul>
                    </div>
                    
                    ${appointmentData.google_meet_link ? `
                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #1976d2; margin-top: 0;">🎥 Google Meet</h3>
                        <p style="margin: 10px 0;">
                            <strong>Ссылка на встречу:</strong><br>
                            <a href="${appointmentData.google_meet_link}" 
                               style="color: #1976d2; text-decoration: none; font-weight: bold; word-break: break-all;">
                                ${appointmentData.google_meet_link}
                            </a>
                        </p>
                        ${appointmentData.meeting_id ? `<p style="margin: 10px 0; font-size: 14px; color: #666;">Meeting ID: ${appointmentData.meeting_id}</p>` : ''}
                    </div>
                    ` : ''}
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <p style="margin: 0; color: #666;">
                        Если нужно перенести встречу, свяжитесь с нами как можно скорее:<br>
                        📧 support@example.com<br>
                        📞 +7 (999) 123-45-67
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: this.config.senderEmail,
        to: appointmentData.email,
        subject: '⏰ Напоминание о встрече завтра',
        html: htmlContent,
      });

      console.log(`Appointment reminder sent to ${appointmentData.email}`);
      return { success: true };

    } catch (error) {
      console.error('Error sending appointment reminder:', error);
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
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">📅 Новая запись</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Получена новая заявка на консультацию</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #2d5a2d; margin-top: 0;">👤 Информация о клиенте</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>👤 Имя:</strong> ${appointmentData.name}</p>
                        <p><strong>📧 Email:</strong> ${appointmentData.email}</p>
                        <p><strong>📞 Телефон:</strong> ${appointmentData.phone}</p>
                        <p><strong>🌐 Сайт:</strong> ${appointmentData.website}</p>
                        <p><strong>💰 Доход:</strong> ${appointmentData.revenue}</p>
                    </div>
                    
                    <h2 style="color: #2d5a2d;">📅 Детали встречи</h2>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>📅 Дата:</strong> ${formattedDate}</p>
                        <p><strong>🕐 Время:</strong> ${appointmentData.appointment_time} (МСК)</p>
                        <p><strong>⏰ Продолжительность:</strong> 60 минут</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <p style="margin: 0; color: #666;">
                        Запись создана автоматически через воронку продаж.<br>
                        Проверьте детали в админ панели.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: this.config.senderEmail,
        to: this.config.adminEmail,
        subject: '📅 Новая запись на консультацию',
        html: htmlContent,
      });

      console.log(`Admin notification sent to ${this.config.adminEmail}`);
      return { success: true };

    } catch (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendWelcomeEmail(userData: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🎉 Welcome!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Registration completed successfully</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #2d5a2d; margin-top: 0;">👋 Hi, ${userData.name}!</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                            Thank you for registering! Your account has been successfully created and is ready to use.
                        </p>
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                            <strong>📧 Email:</strong> ${userData.email}
                        </p>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #2d5a2d; margin-top: 0;">🚀 What's next?</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Log into your account</li>
                            <li>Set up your profile</li>
                            <li>Explore available features</li>
                            <li>Start using the platform</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #856404; margin-top: 0;">💡 Helpful tips:</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Save this email for your records</li>
                            <li>Contact support if you have any questions</li>
                            <li>Check regularly for updates</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://annaraight.com'}/auth/sign-in" 
                           style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            🔑 Sign In to Account
                        </a>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <p style="margin: 0; color: #666;">
                        If you have any questions, please contact us:<br>
                        📧 support@example.com<br>
                        📞 +1 (555) 123-4567
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: this.config.senderEmail,
        to: userData.email,
        subject: '🎉 Welcome! Registration Complete',
        html: htmlContent,
      });

      console.log(`Welcome email sent to ${userData.email}`);
      return { success: true };

    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendVideoEmail(email: string, firstName: string, videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Free Astrology Training is Ready!</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #111827;
                    margin: 0;
                    padding: 20px;
                    background: #f9fafb;
                    min-height: 100vh;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e5e7eb;
                }
                
                .header {
                    background: #ffffff;
                    padding: 30px 40px 20px;
                    text-align: center;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .logo {
                    margin-bottom: 30px;
                }
                
                .logo img {
                    height: 45px;
                    width: auto;
                }
                
                .main-headline {
                    font-size: 2.2rem;
                    font-weight: 800;
                    margin-bottom: 15px;
                    color: #111827;
                    line-height: 1.2;
                }
                
                .subheadline {
                    font-size: 1.1rem;
                    color: #6b7280;
                    font-weight: 400;
                    line-height: 1.5;
                }
                
                .content {
                    padding: 40px;
                }
                
                .greeting {
                    font-size: 1.2rem;
                    margin-bottom: 25px;
                    color: #111827;
                    font-weight: 600;
                }
                
                .intro-text {
                    font-size: 1rem;
                    color: #374151;
                    margin-bottom: 30px;
                    line-height: 1.7;
                }
                
                .video-section {
                    margin: 35px 0;
                    text-align: center;
                    background: #f9fafb;
                    border-radius: 12px;
                    padding: 35px 25px;
                    border: 2px solid #e5e7eb;
                }
                
                .video-preview {
                    position: relative;
                    background: #111827;
                    border-radius: 12px;
                    padding: 40px 20px;
                    margin: 25px 0;
                    overflow: hidden;
                }
                
                .play-button {
                    font-size: 3.5rem;
                    color: #111827;
                    margin-bottom: 15px;
                    display: inline-block;
                    background: #ffffff;
                    border-radius: 50%;
                    width: 90px;
                    height: 90px;
                    line-height: 90px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                }
                
                .video-text {
                    font-size: 1.2rem;
                    color: white;
                    margin-bottom: 10px;
                    font-weight: 700;
                }
                
                .video-subtitle {
                    color: #9ca3af;
                    font-size: 0.95rem;
                    font-style: italic;
                    margin-bottom: 15px;
                }
                
                .video-duration {
                    color: #9ca3af;
                    font-size: 0.9rem;
                }
                
                .cta-button {
                    display: inline-block;
                    background: #111827;
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 1rem;
                    margin: 25px 0;
                    transition: all 0.2s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .cta-button:hover {
                    background: #1f2937;
                    transform: translateY(-1px);
                }
                
                .benefits {
                    background: #f9fafb;
                    padding: 30px;
                    border-radius: 12px;
                    margin: 30px 0;
                    border: 1px solid #e5e7eb;
                }
                
                .benefits h3 {
                    color: #111827;
                    margin-bottom: 20px;
                    font-size: 1.2rem;
                    font-weight: 700;
                    text-align: center;
                }
                
                .benefits ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .benefits li {
                    padding: 10px 0;
                    color: #374151;
                    position: relative;
                    padding-left: 30px;
                    font-size: 1rem;
                    font-weight: 500;
                    border-bottom: 1px solid #f3f4f6;
                }
                
                .benefits li:last-child {
                    border-bottom: none;
                }
                
                .benefits li:before {
                    content: "✓";
                    position: absolute;
                    left: 0;
                    color: #10b981;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                
                .testimonial-quote {
                    background: #f3f4f6;
                    border-left: 4px solid #111827;
                    padding: 25px 30px;
                    margin: 30px 0;
                    border-radius: 0 8px 8px 0;
                    font-style: italic;
                    color: #374151;
                    font-size: 1.05rem;
                    line-height: 1.6;
                }
                
                .footer {
                    background: #f9fafb;
                    padding: 30px 40px;
                    text-align: center;
                    color: #6b7280;
                    border-top: 1px solid #e5e7eb;
                    font-size: 0.9rem;
                }
                
                .footer-brand {
                    margin-bottom: 20px;
                }
                
                .footer-brand img {
                    height: 35px;
                    width: auto;
                    opacity: 0.7;
                }
                
                .footer-text {
                    margin-bottom: 20px;
                    line-height: 1.6;
                }
                
                .footer-links {
                    margin: 15px 0;
                }
                
                .footer-link {
                    color: #6b7280;
                    text-decoration: none;
                    margin: 0 10px;
                    font-size: 0.85rem;
                    transition: color 0.2s ease;
                }
                
                .footer-link:hover {
                    color: #111827;
                }
                
                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    
                    .email-container {
                        margin: 0;
                        border-radius: 6px;
                    }
                    
                    .header, .content {
                        padding: 25px 20px;
                    }
                    
                    .main-headline {
                        font-size: 1.8rem;
                    }
                    
                    .video-section {
                        padding: 25px 15px;
                    }
                    
                    .benefits {
                        padding: 20px 15px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <!-- Header -->
                <div class="header">
                    <div class="logo">
                        <img src="https://annaraight.com/image.png" alt="AstroForYou" />
                    </div>
                    
                    <h1 class="main-headline">
                        Your Free Training is Ready!
                    </h1>
                    
                    <p class="subheadline">
                        Zero-Risk Astrology Certification Opportunity
                    </p>
                </div>
                
                <!-- Content -->
                <div class="content">
                    <div class="greeting">
                        Hi ${firstName}!
                    </div>
                    
                    <p class="intro-text">
                        Thank you for your interest in our Zero-Risk Astrology Certification! I'm excited to share this exclusive training with you that reveals the only mathematically-proven astrology system recognized by scientists.
                    </p>
                    
                    <div class="video-section">
                        <div class="video-preview">
                            <div class="play-button">▶</div>
                            <div class="video-text">
                                "Start Delivering Professional-Grade Astrology Readings"
                            </div>
                            <div class="video-subtitle">
                                Using The Only Mathematically-Proven Astrology System
                            </div>
                            <div class="video-duration">
                                Training Duration: ~45 minutes
                            </div>
                        </div>
                        
                        <a href="https://annaraight.com${videoUrl}?firstName=${firstName}&email=${email}" class="cta-button">
                            🎯 Watch Free Training Now
                        </a>
                    </div>
                    
                    <div class="benefits">
                        <h3>What You'll Discover In This Training:</h3>
                        <ul>
                            <li>How to start delivering professional-grade astrology readings in just 4 months</li>
                            <li>The Reality Management method that transforms people's lives</li>
                            <li>Why this is the only astrology system recognized by scientists</li>
                            <li>How our certified practitioners earn $5,000-$15,000/month from home</li>
                            <li>The exact certification process used by 400+ successful astrologers</li>
                        </ul>
                    </div>
                    
                    <div class="testimonial-quote">
                        "Anna Raight, Master of Astrology, founder of AstroForYou professional astrological service to 95,000 users while serving 5,000+ clients across 40 countries. She's certified 400+ practitioners now earning $5,000-$15,000/month from home."
                    </div>
                    
                    <p class="intro-text">
                        <strong>Important:</strong> This training contains the exact system that's helping hundreds of people build profitable astrology practices. Make sure to watch it completely to understand the full certification opportunity.
                    </p>
                    
                    <p class="intro-text">
                        Remember: You can charge for readings in 4 months... or you don't pay! This is a completely zero-risk opportunity.
                    </p>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <div class="footer-brand">
                        <img src="https://annaraight.com/image.png" alt="AstroForYou" />
                    </div>
                    
                    <div class="footer-text">
                        Copyright 2025 AstroForYou. All rights reserved.
                    </div>
                    
                    <div class="footer-links">
                        <a href="#" class="footer-link">Privacy Policy</a>
                        <a href="#" class="footer-link">Terms & Conditions</a>
                        <a href="#" class="footer-link">Unsubscribe</a>
                    </div>
                    
                    <div class="footer-text" style="margin-top: 20px; font-size: 0.8rem;">
                        This email was sent to ${email}. If you have any questions, please reply to this email.<br>
                        AstroForYou • Melbourne, Australia, 56 Evesham Drive, Point Cook VIC 3030
                    </div>
                </div>
            </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: this.config.senderEmail,
        to: email,
        subject: '🔮 Your Free Astrology Training is Ready! (Zero-Risk Certification)',
        html: htmlContent,
      });

      console.log(`Video email sent to ${email}`);
      return { success: true };

    } catch (error) {
      console.error('Error sending video email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Default configuration for production use
export const getEmailConfig = (): EmailConfig => ({
  smtpServer: process.env.SMTP_SERVER || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  senderEmail: process.env.SENDER_EMAIL || '',
  senderPassword: process.env.SENDER_PASSWORD || '',
  useTLS: process.env.USE_TLS !== 'false',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
});

export { EmailManager };
export default EmailManager;