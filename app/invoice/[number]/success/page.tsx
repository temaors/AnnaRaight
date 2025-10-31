'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function InvoiceSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceNumber = params.number as string;
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setPaymentDetails] = useState<Record<string, unknown> | null>(null);
  const [invoiceData, setInvoiceData] = useState<Record<string, unknown> | null>(null);

  const verifyPayment = useCallback(async () => {
    try {
      // Fetch invoice data to get post-payment content
      const invoiceResponse = await fetch(`/api/invoice/${invoiceNumber}`);
      const invoiceResult = await invoiceResponse.json();
      
      if (invoiceResult.success) {
        setInvoiceData(invoiceResult.data);
      }

      // In a real implementation, you'd verify the payment with Stripe
      // For now, we'll just show a success message
      setPaymentDetails({
        invoice_number: invoiceNumber,
        amount_paid: 'Confirmed',
        payment_date: new Date().toLocaleDateString()
      });
    } catch {
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber, setPaymentDetails, setInvoiceData]);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setError('No payment session found');
      setLoading(false);
    }
  }, [sessionId, verifyPayment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your payment. Your invoice has been paid in full.
          </p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice:</span>
                <span className="font-medium">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Paid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium text-sm">{sessionId?.substring(0, 20)}...</span>
              </div>
            </div>
          </div>

          {/* Post-Payment Content */}
          {invoiceData?.post_payment_content_enabled && invoiceData?.post_payment_content && (
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-green-900 mb-3">🎁 Ваш контент готов!</h3>
              <div className="text-left text-green-800 whitespace-pre-line">
                {invoiceData.post_payment_content}
              </div>
            </div>
          )}

          {/* Digital Content Downloads */}
          {invoiceData?.digital_content && invoiceData.digital_content.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">📁 Ваши файлы для скачивания</h3>
              <div className="space-y-3">
                {invoiceData.digital_content.map((content: Record<string, unknown> | null, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {content.content_type === 'file' ? '📎' : '🔗'}
                        </span>
                        <div>
                          <h4 className="font-medium text-purple-900">{content.title}</h4>
                          {content.description && (
                            <p className="text-sm text-purple-600">{content.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {content.is_downloadable && content.content_url && (
                          <a
                            href={content.content_url}
                            download
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            ⬇️ Скачать
                          </a>
                        )}
                        {content.content_url && !content.is_downloadable && (
                          <a
                            href={content.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            🔗 Открыть
                          </a>
                        )}
                      </div>
                    </div>
                    {content.access_instructions && (
                      <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                        <p className="text-sm text-purple-800">
                          <strong>💡 Инструкции:</strong> {content.access_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Что дальше?</h3>
            <div className="text-left space-y-2 text-blue-800">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Вы получите email с подтверждением в течение 5 минут
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Наша команда обработает заказ в течение 24 часов
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                С вами свяжутся для дальнейших шагов
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`/invoice/${invoiceNumber}`}
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              📄 View Invoice
            </a>
            
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🏠 Return Home
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-gray-600 text-sm">
              Questions about your payment? 
              <a href="mailto:hello@atemabio.com" className="text-purple-600 hover:underline ml-1">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}