/**
 * Email Core Types
 * Reusable types for email system
 */

export interface EmailConfig {
  smtpServer: string;
  smtpPort: number;
  senderEmail: string;
  senderPassword: string;
  useTLS: boolean;
  useSSL: boolean;
  adminEmail: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export interface AppointmentData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  revenue?: string;
  appointment_date: string;
  appointment_time: string;
  timezone?: string;
  google_meet_link?: string;
  meeting_id?: string;
}

export interface EmailTemplateData {
  email: string;
  firstName: string;
  videoUrl?: string;
  [key: string]: any;
}

export interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    cid: string;
  }>;
}

export interface InvoiceData {
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
}
