import { NextRequest, NextResponse } from 'next/server';
import { invoiceManager } from '@/lib/invoice-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const status = statusParam as 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const result = await invoiceManager.getInvoicesForAdmin({
      status,
      limit,
      offset
    });

    const stats = await invoiceManager.getInvoiceStats();

    return NextResponse.json({
      success: true,
      data: {
        invoices: result.invoices,
        total: result.total,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}