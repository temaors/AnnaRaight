import twilio from 'twilio';

// SMS Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

interface SMSMessage {
  to: string;
  message: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
        this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        this.isConfigured = true;
        console.log('✅ Twilio SMS service initialized successfully');
      } else {
        console.log('⚠️ Twilio credentials not configured - SMS service disabled');
        console.log('Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Twilio SMS service:', error);
    }
  }

  async sendSMS(smsData: SMSMessage): Promise<SMSResponse> {
    if (!this.isConfigured || !this.client) {
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    try {
      // Validate phone number format
      const phoneNumber = this.formatPhoneNumber(smsData.to);
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const message = await this.client.messages.create({
        body: smsData.message,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`✅ SMS sent successfully to ${phoneNumber}, SID: ${message.sid}`);
      
      return {
        success: true,
        messageId: message.sid
      };

    } catch (error: unknown) {
      console.error('❌ Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }

  private formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Handle different formats
    if (digits.length === 10) {
      // US number without country code
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // US number with country code
      return `+${digits}`;
    } else if (digits.length >= 10) {
      // International number
      return `+${digits}`;
    }

    return null;
  }

  // Appointment reminder SMS templates
  createAppointmentReminderSMS(appointmentData: {
    name: string;
    date: string;
    time: string;
    meetLink?: string;
  }): string {
    const { name, date, time, meetLink } = appointmentData;
    
    let message = `Hi ${name}! Reminder: Your astrology consultation is scheduled for ${date} at ${time}.`;
    
    if (meetLink) {
      message += ` Join here: ${meetLink}`;
    }
    
    message += ' Looking forward to speaking with you!';
    
    return message;
  }

  createAppointmentConfirmationSMS(appointmentData: {
    name: string;
    date: string;
    time: string;
    meetLink?: string;
  }): string {
    const { name, date, time, meetLink } = appointmentData;
    
    let message = `Hi ${name}! Your astrology consultation is confirmed for ${date} at ${time}.`;
    
    if (meetLink) {
      message += ` Meeting link: ${meetLink}`;
    }
    
    message += ' You will receive a reminder 6 hours before. See you soon!';
    
    return message;
  }

  // Test SMS functionality
  async sendTestSMS(phoneNumber: string): Promise<SMSResponse> {
    return this.sendSMS({
      to: phoneNumber,
      message: 'This is a test message from your Funnel Master application. SMS service is working correctly! 🎉'
    });
  }

  // Check if SMS service is available
  isAvailable(): boolean {
    return this.isConfigured;
  }

  // Get service status
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      hasCredentials: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER),
      fromNumber: TWILIO_PHONE_NUMBER || 'Not configured'
    };
  }
}

// Export singleton instance
export const smsService = new SMSService();

// Export types for use in other files
export type { SMSMessage, SMSResponse };