import { NextRequest, NextResponse } from 'next/server';
import { invoiceManager } from '@/lib/invoice-manager';

export async function POST(request: NextRequest) {
  try {
    const { invoice_id } = await request.json();
    console.log('📤 Starting invoice send process for ID:', invoice_id);

    if (!invoice_id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session for the invoice
    console.log('⚙️ Creating Stripe checkout session...');
    const result = await invoiceManager.createStripeCheckoutSession(invoice_id);
    console.log('✅ Checkout session result:', { success: result.success, hasUrl: !!result.sessionUrl, error: result.error });

    if (!result.success) {
      console.error('❌ Failed to create checkout session:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    console.log('🎉 Invoice send process completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      checkout_url: result.sessionUrl
    });

  } catch (error) {
    console.error('💥 Critical error sending invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send invoice' },
      { status: 500 }
    );
  }
}