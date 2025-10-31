import { NextRequest, NextResponse } from 'next/server';
import { invoiceManager } from '@/lib/invoice-manager';
import { statusManager } from '@/lib/status-manager';

interface CreateInvoiceRequest {
  lead_id: number;
  email: string;
  due_date?: string;
  notes?: string;
  currency?: string;
  items: Array<{
    product_id?: number;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  // New fields for images and content
  image_url?: string;
  image_filename?: string;
  post_payment_content?: string;
  post_payment_content_enabled?: boolean;
  digital_content?: Array<{
    content_type: 'file' | 'link' | 'text' | 'course_access';
    title: string;
    description?: string;
    content_url?: string;
    filename?: string;
    access_instructions?: string;
    is_downloadable: boolean;
    download_limit: number;
    expiry_days: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData: CreateInvoiceRequest = await request.json();
    
    console.log('📝 Creating invoice with data:', {
      lead_id: invoiceData.lead_id,
      email: invoiceData.email,
      has_image: !!invoiceData.image_url,
      image_url: invoiceData.image_url,
      has_content: !!invoiceData.post_payment_content,
      content_enabled: invoiceData.post_payment_content_enabled,
      digital_content_count: invoiceData.digital_content?.length || 0
    });

    // Validate required fields
    if (!invoiceData.lead_id || !invoiceData.email || !invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: lead_id, email, and items are required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of invoiceData.items) {
      if (!item.description || !item.quantity || !item.unit_price) {
        return NextResponse.json(
          { success: false, error: 'Each item must have description, quantity, and unit_price' },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const itemsWithTotals = invoiceData.items.map(item => ({
      ...item,
      total_price: item.quantity * item.unit_price
    }));

    const totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.total_price, 0);

    // Create invoice
    const result = await invoiceManager.createInvoice({
      lead_id: invoiceData.lead_id,
      email: invoiceData.email,
      total_amount: totalAmount,
      currency: invoiceData.currency || 'USD',
      due_date: invoiceData.due_date,
      invoice_date: new Date().toISOString().split('T')[0],
      notes: invoiceData.notes,
      items: itemsWithTotals,
      created_by: 1, // TODO: Get from session/auth
      // New fields
      image_url: invoiceData.image_url,
      image_filename: invoiceData.image_filename,
      post_payment_content: invoiceData.post_payment_content,
      post_payment_content_enabled: invoiceData.post_payment_content_enabled,
      digital_content: invoiceData.digital_content
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Update lead status to invoice_sent
    if (result.invoice) {
      await statusManager.handleInvoiceSent(invoiceData.lead_id, result.invoice.invoice_number);
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      invoice: result.invoice
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}