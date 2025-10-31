import { NextRequest, NextResponse } from 'next/server';
import { invoiceManager } from '@/lib/invoice-manager';

export async function POST(
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

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Invoice has already been paid' },
        { status: 400 }
      );
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Invoice has been cancelled' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const result = await invoiceManager.createStripeCheckoutSession(invoice.id!);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: result.sessionUrl
    });

  } catch (error) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}