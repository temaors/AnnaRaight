import { NextRequest, NextResponse } from 'next/server';
import { invoiceManager } from '@/lib/invoice-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number: invoiceNumber } = await params;
    
    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, error: 'Invoice number is required' },
        { status: 400 }
      );
    }

    const invoice = await invoiceManager.getInvoiceByNumber(invoiceNumber);
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Mark invoice as viewed if it was sent
    if (invoice.status === 'sent') {
      await invoiceManager.markInvoiceViewed(invoice.id!);
      invoice.status = 'viewed';
    }

    return NextResponse.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}