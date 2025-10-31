import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { stripe, createOrRetrieveCustomer } from './stripe-config';
import { statusManager } from './status-manager';
import { whcEmailManager } from './email-whc';

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InvoiceAttachment {
  id?: number;
  invoice_id?: number;
  filename: string;
  original_filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at?: string;
}

export interface InvoiceDigitalContent {
  id?: number;
  invoice_id?: number;
  content_type: 'file' | 'link' | 'text' | 'course_access';
  title: string;
  description?: string;
  content_url?: string;
  filename?: string;
  file_size?: number;
  access_instructions?: string;
  is_downloadable: boolean;
  download_limit: number;
  expiry_days: number;
  created_at?: string;
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  lead_id: number;
  email: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  total_amount: number;
  currency: string;
  due_date?: string;
  invoice_date: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  notes?: string;
  pdf_path?: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  created_by?: number;
  // New image fields
  image_url?: string;
  image_filename?: string;
  image_uploaded_at?: string;
  // New post-payment content fields
  post_payment_content?: string; 
  post_payment_content_enabled?: boolean;
  content_access_token?: string;
  // Related data
  items: InvoiceItem[];
  attachments?: InvoiceAttachment[];
  digital_content?: InvoiceDigitalContent[];
}

// Database row interfaces
interface InvoiceRow {
  id: number;
  invoice_number: string;
  lead_id: number;
  email: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  total_amount: number;
  currency: string;
  due_date?: string;
  invoice_date: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  notes?: string;
  pdf_path?: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  created_by?: number;
  image_url?: string;
  image_filename?: string;
  image_uploaded_at?: string;
  post_payment_content?: string;
  post_payment_content_enabled: number;
  content_access_token?: string;
}

interface InvoiceItemRow {
  id: number;
  invoice_id: number;
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceDigitalContentRow {
  id: number;
  invoice_id: number;
  content_type: 'file' | 'link' | 'text' | 'course_access';
  title: string;
  description?: string;
  content_url?: string;
  filename?: string;
  access_instructions?: string;
  is_downloadable: number;
  download_limit: number;
  expiry_days: number;
  created_at?: string;
}

interface LeadRow {
  name?: string;
}

interface InvoiceStatsRow {
  total_invoices: number;
  total_revenue: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
}

interface InvoiceCountRow {
  total: number;
}

interface InvoiceWithLeadRow extends InvoiceRow {
  lead_name?: string;
}

export class InvoiceManager {
  private getDatabase() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return new Database(path.join(dataDir, 'funnel.db'));
  }

  // Generate unique invoice number
  private generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
  }

  // Create new invoice
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'status' | 'created_at'>): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
    const db = this.getDatabase();
    
    try {
      const invoiceNumber = this.generateInvoiceNumber();
      
      // Generate content access token if post-payment content is enabled
      const contentAccessToken = invoiceData.post_payment_content_enabled 
        ? crypto.randomBytes(32).toString('hex')
        : null;
      
      // Insert invoice
      const insertInvoiceStmt = db.prepare(`
        INSERT INTO invoices (
          invoice_number, lead_id, email, status, total_amount, currency,
          due_date, invoice_date, notes, created_by,
          image_url, image_filename, image_uploaded_at,
          post_payment_content, post_payment_content_enabled, content_access_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const invoiceResult = insertInvoiceStmt.run(
        invoiceNumber,
        invoiceData.lead_id,
        invoiceData.email,
        'draft',
        invoiceData.total_amount,
        invoiceData.currency || 'USD',
        invoiceData.due_date || null,
        invoiceData.invoice_date || new Date().toISOString().split('T')[0],
        invoiceData.notes || null,
        invoiceData.created_by || null,
        invoiceData.image_url || null,
        invoiceData.image_filename || null,
        invoiceData.image_url ? new Date().toISOString() : null,
        invoiceData.post_payment_content || null,
        invoiceData.post_payment_content_enabled ? 1 : 0,
        contentAccessToken
      );

      const invoiceId = invoiceResult.lastInsertRowid as number;

      // Insert invoice items
      const insertItemStmt = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, product_id, description, quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of invoiceData.items) {
        insertItemStmt.run(
          invoiceId,
          item.product_id || null,
          item.description,
          item.quantity,
          item.unit_price,
          item.total_price
        );
      }

      // Insert digital content items if any
      if (invoiceData.digital_content && invoiceData.digital_content.length > 0) {
        const insertContentStmt = db.prepare(`
          INSERT INTO invoice_digital_content (
            invoice_id, content_type, title, description, content_url, filename,
            access_instructions, is_downloadable, download_limit, expiry_days
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const content of invoiceData.digital_content) {
          insertContentStmt.run(
            invoiceId,
            content.content_type,
            content.title,
            content.description || null,
            content.content_url || null,
            content.filename || null,
            content.access_instructions || null,
            content.is_downloadable ? 1 : 0,
            content.download_limit || 0,
            content.expiry_days || 0
          );
        }
      }

      // Retrieve the created invoice
      const invoice = await this.getInvoiceById(invoiceId);
      
      return { success: true, invoice: invoice || undefined };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      db.close();
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId: number): Promise<Invoice | null> {
    const db = this.getDatabase();
    
    try {
      // Get invoice
      const invoice = db.prepare(`
        SELECT * FROM invoices WHERE id = ?
      `).get(invoiceId) as InvoiceRow | undefined;

      if (!invoice) return null;

      // Get invoice items
      const items = db.prepare(`
        SELECT * FROM invoice_items WHERE invoice_id = ?
      `).all(invoiceId) as InvoiceItemRow[];

      // Get digital content
      const digitalContent = db.prepare(`
        SELECT * FROM invoice_digital_content WHERE invoice_id = ?
      `).all(invoiceId) as InvoiceDigitalContentRow[];

      return {
        ...invoice,
        post_payment_content_enabled: Boolean(invoice.post_payment_content_enabled),
        items: items.map(item => ({
          id: item.id,
          invoice_id: item.invoice_id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })),
        digital_content: digitalContent.map(content => ({
          id: content.id,
          invoice_id: content.invoice_id,
          content_type: content.content_type,
          title: content.title,
          description: content.description,
          content_url: content.content_url,
          filename: content.filename,
          access_instructions: content.access_instructions,
          is_downloadable: Boolean(content.is_downloadable),
          download_limit: content.download_limit,
          expiry_days: content.expiry_days,
          created_at: content.created_at
        }))
      };
    } finally {
      db.close();
    }
  }

  // Get invoice by invoice number
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const db = this.getDatabase();
    
    try {
      const invoice = db.prepare(`
        SELECT * FROM invoices WHERE invoice_number = ?
      `).get(invoiceNumber) as InvoiceRow | undefined;

      if (!invoice) return null;

      const items = db.prepare(`
        SELECT * FROM invoice_items WHERE invoice_id = ?
      `).all(invoice.id) as InvoiceItemRow[];

      // Get digital content
      const digitalContent = db.prepare(`
        SELECT * FROM invoice_digital_content WHERE invoice_id = ?
      `).all(invoice.id) as InvoiceDigitalContentRow[];

      return {
        ...invoice,
        post_payment_content_enabled: Boolean(invoice.post_payment_content_enabled),
        items: items.map(item => ({
          id: item.id,
          invoice_id: item.invoice_id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })),
        digital_content: digitalContent.map(content => ({
          id: content.id,
          invoice_id: content.invoice_id,
          content_type: content.content_type,
          title: content.title,
          description: content.description,
          content_url: content.content_url,
          filename: content.filename,
          access_instructions: content.access_instructions,
          is_downloadable: Boolean(content.is_downloadable),
          download_limit: content.download_limit,
          expiry_days: content.expiry_days,
          created_at: content.created_at
        }))
      };
    } finally {
      db.close();
    }
  }

  // Update invoice status
  async updateInvoiceStatus(invoiceId: number, status: Invoice['status'], additionalData?: {
    stripe_payment_intent_id?: string;
    stripe_invoice_id?: string;
    paid_at?: string;
    viewed_at?: string;
    sent_at?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const db = this.getDatabase();
    
    try {
      let updateQuery = 'UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP';
      const updateParams: (string | number)[] = [status];

      if (additionalData?.stripe_payment_intent_id) {
        updateQuery += ', stripe_payment_intent_id = ?';
        updateParams.push(additionalData.stripe_payment_intent_id);
      }

      if (additionalData?.stripe_invoice_id) {
        updateQuery += ', stripe_invoice_id = ?';
        updateParams.push(additionalData.stripe_invoice_id);
      }

      if (additionalData?.paid_at) {
        updateQuery += ', paid_at = ?';
        updateParams.push(additionalData.paid_at);
      }

      if (additionalData?.viewed_at) {
        updateQuery += ', viewed_at = ?';
        updateParams.push(additionalData.viewed_at);
      }

      if (additionalData?.sent_at) {
        updateQuery += ', sent_at = ?';
        updateParams.push(additionalData.sent_at);
      }

      updateQuery += ' WHERE id = ?';
      updateParams.push(invoiceId);

      const updateStmt = db.prepare(updateQuery);
      updateStmt.run(...updateParams);

      // Update lead status if payment completed
      if (status === 'paid') {
        const invoice = await this.getInvoiceById(invoiceId);
        if (invoice) {
          await statusManager.handlePaymentCompleted(
            invoice.lead_id, 
            invoice.invoice_number, 
            invoice.total_amount
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      db.close();
    }
  }

  // Create Stripe checkout session for invoice
  async createStripeCheckoutSession(invoiceId: number): Promise<{ success: boolean; sessionUrl?: string; error?: string }> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Check if Stripe is configured
      if (!stripe) {
        // Demo mode - just update status and return demo URL
        await this.updateInvoiceStatus(invoiceId, 'sent', {
          sent_at: new Date().toISOString(),
        });

        // Send invoice email
        await this.sendInvoiceByEmail(invoice);

        // Return demo checkout URL
        const demoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${invoice.invoice_number}?demo=true`;
        return { 
          success: true, 
          sessionUrl: demoUrl,
          error: 'Stripe не настроен. Работаем в демо-режиме. Для реальных платежей настройте Stripe ключи в .env.local' 
        };
      }

      // Create or retrieve Stripe customer
      const customerResult = await createOrRetrieveCustomer(invoice.email);
      if (!customerResult.success) {
        return { success: false, error: 'Failed to create customer' };
      }

      // Prepare line items
      const lineItems = invoice.items.map(item => ({
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: {
            name: item.description,
          },
          unit_amount: Math.round(item.unit_price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerResult.customer?.id,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${invoice.invoice_number}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${invoice.invoice_number}`,
        metadata: {
          invoice_id: invoiceId.toString(),
          invoice_number: invoice.invoice_number,
          lead_id: invoice.lead_id.toString(),
        },
      });

      // Update invoice with Stripe session info
      await this.updateInvoiceStatus(invoiceId, 'sent', {
        stripe_payment_intent_id: session.payment_intent as string,
        sent_at: new Date().toISOString(),
      });

      // Send invoice email
      await this.sendInvoiceByEmail(invoice);

      return { success: true, sessionUrl: session.url! };
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Send invoice by email
  private async sendInvoiceByEmail(invoice: Invoice): Promise<void> {
    try {
      console.log(`📧 Starting email send for invoice ${invoice.invoice_number} to ${invoice.email}`);
      
      // Get lead name from database
      const db = this.getDatabase();
      let leadName = '';
      
      try {
        const lead = db.prepare('SELECT name FROM leads WHERE id = ?').get(invoice.lead_id) as LeadRow | undefined;
        leadName = lead?.name || '';
        console.log(`👤 Found lead name: ${leadName}`);
      } finally {
        db.close();
      }

      const invoiceUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${invoice.invoice_number}`;
      console.log(`🔗 Invoice URL: ${invoiceUrl}`);
      
      console.log(`⚙️ Preparing email data for invoice ${invoice.invoice_number}...`);
      const emailData = {
        invoice_number: invoice.invoice_number,
        email: invoice.email,
        name: leadName,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        due_date: invoice.due_date,
        invoice_url: invoiceUrl,
        items: invoice.items,
        notes: invoice.notes,
        image_url: invoice.image_url,
        post_payment_content: invoice.post_payment_content,
        post_payment_content_enabled: invoice.post_payment_content_enabled
      };
      
      console.log(`📤 Sending invoice email via WHC email manager...`);
      const emailResult = await whcEmailManager.sendInvoiceEmail(emailData);

      if (emailResult.success) {
        console.log(`✅ Invoice email sent successfully to ${invoice.email}`);
      } else {
        console.error(`❌ Failed to send invoice email to ${invoice.email}:`, emailResult.error);
      }
    } catch (error) {
      console.error('💥 Critical error sending invoice email:', error);
    }
  }

  // Mark invoice as viewed
  async markInvoiceViewed(invoiceId: number): Promise<void> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (invoice && invoice.status === 'sent') {
      await this.updateInvoiceStatus(invoiceId, 'viewed', {
        viewed_at: new Date().toISOString()
      });
    }
  }

  // Get invoices for admin dashboard
  async getInvoicesForAdmin(filters?: {
    status?: Invoice['status'];
    limit?: number;
    offset?: number;
  }): Promise<{ invoices: Invoice[]; total: number }> {
    const db = this.getDatabase();
    
    try {
      let whereClause = '';
      const queryParams: string[] = [];

      if (filters?.status) {
        whereClause = 'WHERE status = ?';
        queryParams.push(filters.status);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM invoices ${whereClause}`;
      const totalResult = db.prepare(countQuery).get(...queryParams) as InvoiceCountRow;
      const total = totalResult.total;

      // Get invoices
      let invoicesQuery = `
        SELECT i.*, l.name as lead_name 
        FROM invoices i
        LEFT JOIN leads l ON i.lead_id = l.id
        ${whereClause}
        ORDER BY i.created_at DESC
      `;

      if (filters?.limit) {
        invoicesQuery += ` LIMIT ${filters.limit}`;
        if (filters?.offset) {
          invoicesQuery += ` OFFSET ${filters.offset}`;
        }
      }

      const invoicesData = db.prepare(invoicesQuery).all(...queryParams) as InvoiceWithLeadRow[];

      // Get items for each invoice
      const invoices: Invoice[] = [];
      for (const invoiceData of invoicesData) {
        const items = db.prepare(`
          SELECT * FROM invoice_items WHERE invoice_id = ?
        `).all(invoiceData.id) as InvoiceItemRow[];

        invoices.push({
          ...invoiceData,
          post_payment_content_enabled: Boolean(invoiceData.post_payment_content_enabled),
          items: items.map(item => ({
            id: item.id,
            invoice_id: item.invoice_id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))
        });
      }

      return { invoices, total };
    } finally {
      db.close();
    }
  }

  // Get invoice statistics
  async getInvoiceStats(): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
  }> {
    const db = this.getDatabase();
    
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_invoices,
          SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
          COUNT(CASE WHEN status IN ('sent', 'viewed') THEN 1 END) as pending_invoices,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
        FROM invoices
      `).get() as InvoiceStatsRow;

      return {
        totalInvoices: stats.total_invoices || 0,
        totalRevenue: stats.total_revenue || 0,
        paidInvoices: stats.paid_invoices || 0,
        pendingInvoices: stats.pending_invoices || 0,
        overdueInvoices: stats.overdue_invoices || 0,
      };
    } finally {
      db.close();
    }
  }
}

// Export singleton instance
export const invoiceManager = new InvoiceManager();