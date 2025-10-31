'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  type: 'main' | 'upsell' | 'bump';
}

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  // Demo products
  const mainProduct: Product = {
    id: 'quick-start',
    name: 'Quick Start Bundle',
    description: 'Everything you need to implement the system and see results fast',
    price: 97,
    originalPrice: 297,
    type: 'main'
  };

  const orderBump: Product = {
    id: 'templates',
    name: 'Done-For-You Templates Pack',
    description: 'Save hours with our proven templates and swipe files',
    price: 27,
    originalPrice: 67,
    type: 'bump'
  };

  const upsells: Product[] = [
    {
      id: 'premium-support',
      name: 'Premium Support Package',
      description: '90 days of direct access to our expert team',
      price: 197,
      originalPrice: 497,
      type: 'upsell'
    },
    {
      id: 'advanced-training',
      name: 'Advanced Mastery Training',
      description: 'Deep dive training for scaling to 6-figures and beyond',
      price: 297,
      originalPrice: 997,
      type: 'upsell'
    }
  ];

  const [selectedProducts] = useState<string[]>(['quick-start']);
  const [orderBumpSelected, setOrderBumpSelected] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    // Track page visit
    const trackVisit = async () => {
      await supabase
        .from('funnel_analytics')
        .insert({
          page_visited: 'checkout',
          timestamp: new Date().toISOString()
        });
    };
    trackVisit();
  }, [supabase]);

  const calculateTotal = () => {
    let total = 0;
    
    // Add main product
    if (selectedProducts.includes(mainProduct.id)) {
      total += mainProduct.price;
    }

    // Add order bump
    if (orderBumpSelected) {
      total += orderBump.price;
    }

    // Add upsells
    upsells.forEach(upsell => {
      if (selectedProducts.includes(upsell.id)) {
        total += upsell.price;
      }
    });

    // Apply discount
    total = total * (1 - discount / 100);

    return total;
  };

  const applyCoupon = () => {
    // Demo coupon codes
    if (couponCode.toUpperCase() === 'SAVE20') {
      setDiscount(20);
    } else if (couponCode.toUpperCase() === 'SPECIAL50') {
      setDiscount(50);
    } else {
      setError('Invalid coupon code');
      setDiscount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In a real app, you would integrate with Stripe here
      // For demo, we'll simulate a successful payment

      // Store order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          email,
          name,
          total_amount: calculateTotal(),
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (orderError) throw orderError;

      // Store order items
      const items = [];
      if (selectedProducts.includes(mainProduct.id)) {
        items.push({
          order_id: order.id,
          product_id: mainProduct.id,
          product_name: mainProduct.name,
          price: mainProduct.price,
          item_type: 'main'
        });
      }

      if (orderBumpSelected) {
        items.push({
          order_id: order.id,
          product_id: orderBump.id,
          product_name: orderBump.name,
          price: orderBump.price,
          item_type: 'bump'
        });
      }

      upsells.forEach(upsell => {
        if (selectedProducts.includes(upsell.id)) {
          items.push({
            order_id: order.id,
            product_id: upsell.id,
            product_name: upsell.name,
            price: upsell.price,
            item_type: 'upsell'
          });
        }
      });

      if (items.length > 0) {
        // Insert items one by one since our API doesn't support batch inserts
        for (const item of items) {
          item.order_id = order?.data?.id;
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(item);

          if (itemsError) throw itemsError;
        }
      }

      // Track conversion
      await supabase
        .from('funnel_analytics')
        .insert({
          page_visited: 'purchase_completed',
          timestamp: new Date().toISOString(),
          metadata: JSON.stringify({ order_id: order?.data?.id, total: calculateTotal() })
        });

      // Redirect to success page
      router.push('/funnel/success');
    } catch (err) {
      console.error('Error:', err);
      setError('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Secure Checkout</h1>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              SSL Secured
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="card">Card Number</Label>
                    <Input
                      id="card"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Demo Notice */}
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Demo Mode:</strong> This is a demo checkout. Use any test card number like 4242 4242 4242 4242
                  </p>
                </div>
              </div>

              {/* Order Bump */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orderBumpSelected}
                    onChange={(e) => setOrderBumpSelected(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      🎁 ONE-TIME OFFER: Add {orderBump.name}
                    </h3>
                    <p className="text-gray-700 mt-1">{orderBump.description}</p>
                    <p className="mt-2">
                      <span className="line-through text-gray-500">${orderBump.originalPrice}</span>
                      <span className="font-bold text-green-600 ml-2">Only ${orderBump.price}</span>
                      <span className="text-sm text-gray-600 ml-2">(Save ${(orderBump.originalPrice || 0) - orderBump.price}!)</span>
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
              >
                {loading ? 'Processing...' : `Complete Order - $${calculateTotal().toFixed(2)}`}
              </Button>

              {/* Security Badges */}
              <div className="flex items-center justify-center space-x-4 text-gray-500">
                <span className="text-sm">🔒 Secure Checkout</span>
                <span className="text-sm">💳 Safe Payment</span>
                <span className="text-sm">✅ Money-Back Guarantee</span>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Products */}
              <div className="space-y-4">
                {/* Main Product */}
                <div className="pb-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{mainProduct.name}</h3>
                      <p className="text-sm text-gray-600">{mainProduct.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">${mainProduct.price}</p>
                      {mainProduct.originalPrice && (
                        <p className="text-sm line-through text-gray-500">${mainProduct.originalPrice}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Bump */}
                {orderBumpSelected && (
                  <div className="pb-4 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{orderBump.name}</h3>
                        <p className="text-sm text-gray-600">{orderBump.description}</p>
                      </div>
                      <p className="font-semibold">${orderBump.price}</p>
                    </div>
                  </div>
                )}

                {/* Coupon Code */}
                <div className="pb-4 border-b">
                  <Label htmlFor="coupon">Coupon Code</Label>
                  <div className="flex mt-1">
                    <Input
                      id="coupon"
                      type="text"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={applyCoupon}
                      className="ml-2"
                    >
                      Apply
                    </Button>
                  </div>
                  {discount > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {discount}% discount applied!
                    </p>
                  )}
                </div>

                {/* Total */}
                <div>
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    30-day money-back guarantee
                  </p>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 italic">
                  &ldquo;This bundle gave me everything I needed to get started. 
                  I made my investment back in the first week!&rdquo;
                </p>
                <p className="text-sm font-semibold mt-2">- David M.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}