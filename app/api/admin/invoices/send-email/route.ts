import { NextRequest, NextResponse } from 'next/server';
import { invoiceManager } from '@/lib/invoice-manager';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { invoice_id } = await request.json();

    if (!invoice_id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Get invoice details
    const invoice = await invoiceManager.getInvoiceById(invoice_id);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get lead name
    const db = new Database(path.join(process.cwd(), 'data', 'funnel.db'));
    let leadName = '';

    try {
      const lead = db.prepare('SELECT name FROM leads WHERE id = ?').get(invoice.lead_id) as { name: string } | undefined;
      leadName = lead?.name || '';
    } finally {
      db.close();
    }

    // Dynamic import to avoid edge runtime issues
    const { emailManager } = await import('@/lib/email/email-manager');

    // Send invoice email
    const invoiceUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${invoice.invoice_number}`;

    const emailResult = await emailManager.sendInvoiceEmail({
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
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice email sent successfully'
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send invoice email' },
      { status: 500 }
    );
  }
}