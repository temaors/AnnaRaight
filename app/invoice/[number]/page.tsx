'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  lead_id: number;
  email: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  total_amount: number;
  currency: string;
  due_date?: string;
  invoice_date: string;
  notes?: string;
  image_url?: string;
  post_payment_content?: string;
  post_payment_content_enabled?: boolean;
  items: InvoiceItem[];
}

export default function InvoicePage() {
  const params = useParams();
  const invoiceNumber = params.number as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const fetchInvoice = useCallback(async () => {
    try {
      const response = await fetch(`/api/invoice/${invoiceNumber}`);
      const result = await response.json();
      
      if (result.success) {
        setInvoice(result.invoice);
      } else {
        setError(result.error || 'Invoice not found');
      }
    } catch {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber]);

  useEffect(() => {
    if (invoiceNumber) {
      fetchInvoice();
    }
  }, [invoiceNumber, fetchInvoice]);

  const handlePayment = async () => {
    if (!invoice) return;
    
    setPaying(true);
    try {
      const response = await fetch(`/api/invoice/${invoiceNumber}/pay`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success && result.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = result.checkout_url;
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch {
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </Card>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'viewed': case 'sent': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-gray-600">
                Invoice Date: {formatDate(invoice.invoice_date)}
              </p>
              {invoice.due_date && (
                <p className="text-gray-600">
                  Due Date: {formatDate(invoice.due_date)}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                {invoice.status.toUpperCase()}
              </span>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">
                  ${invoice.total_amount.toFixed(2)} {invoice.currency}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Billing Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Bill To:</h2>
          <p className="text-gray-900 font-medium">{invoice.email}</p>
        </Card>

        {/* Invoice Items */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
          
          {/* Invoice Image */}
          {invoice.image_url && (
            <div className="mb-6 text-center">
              <img 
                src={invoice.image_url} 
                alt="Invoice image" 
                className="max-w-full max-h-64 rounded-lg shadow-md mx-auto"
              />
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Unit Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4 text-gray-900">{item.description}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      ${item.unit_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      ${item.total_price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right font-semibold text-gray-700">
                    Total Amount:
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-xl text-gray-900">
                    ${invoice.total_amount.toFixed(2)} {invoice.currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </Card>
        )}

        {/* Post-Payment Content Preview */}
        {invoice.post_payment_content_enabled && invoice.post_payment_content && (
          <Card className="p-6 mb-6 bg-green-50">
            <h2 className="text-xl font-semibold text-green-800 mb-4">🎁 Что вы получите после оплаты:</h2>
            <div className="text-green-700 whitespace-pre-line bg-white p-4 rounded-lg">
              {invoice.post_payment_content}
            </div>
          </Card>
        )}

        {/* Payment Section */}
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <Card className="p-6 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Ready to Pay?</h2>
              <p className="text-gray-600 mb-6">
                Click the button below to securely pay with credit card via Stripe.
              </p>
              
              <button
                onClick={handlePayment}
                disabled={paying}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {paying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    🔒 Pay ${invoice.total_amount.toFixed(2)} Securely
                  </>
                )}
              </button>
              
              <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span>🔒 SSL Secured</span>
                <span>💳 All major cards accepted</span>
                <span>⚡ Instant confirmation</span>
              </div>

              {/* Demo Mode Notice */}
              {typeof window !== 'undefined' && window.location.search.includes('demo=true') && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ <strong>Демо режим:</strong> Stripe не настроен. Для реальных платежей добавьте Stripe ключи в .env.local
                  </p>
                  <p className="text-yellow-700 text-xs mt-2">
                    Получите ключи на <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">stripe.com</a>
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Paid Status */}
        {invoice.status === 'paid' && (
          <Card className="p-6 mb-6 bg-green-50 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">Payment Received</h2>
              <p className="text-green-600">
                Thank you! This invoice has been paid in full.
              </p>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>© 2025 AstroForYou. All rights reserved.</p>
          <p className="mt-1">
            Questions? Contact us at hello@atemabio.com
          </p>
        </div>
      </div>
    </div>
  );
}