'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function SuccessPage() {
  const supabase = createClient();

  useEffect(() => {
    // Track page visit
    const trackVisit = async () => {
      await supabase
        .from('funnel_analytics')
        .insert({
          page_visited: 'success',
          timestamp: new Date().toISOString()
        });
    };
    trackVisit();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-white">
      {/* Success Header */}
      <div className="bg-green-50 py-8 px-4 text-center border-b border-green-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to the Family!
          </h1>
          <p className="text-xl text-gray-700">
            Your purchase was successful. Check your email for access details.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Next Steps */}
        <div className="bg-purple-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            🚀 Here&apos;s What Happens Next
          </h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Check Your Email</h3>
                <p className="text-gray-700">
                  We&apos;ve sent your login credentials and quick start guide to your email address. 
                  It should arrive within 5 minutes.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Access Your Dashboard</h3>
                <p className="text-gray-700">
                  Use the link in your email to access your member dashboard where all your 
                  resources are waiting.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Join Our Community</h3>
                <p className="text-gray-700">
                  Connect with other members in our private community for support, 
                  accountability, and networking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Video */}
        <div className="bg-gray-50 rounded-lg p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Get Started in 5 Minutes</h2>
          <p className="text-gray-700 mb-6">
            Watch this quick orientation video to make the most of your purchase
          </p>
          <div className="bg-black rounded-lg overflow-hidden max-w-2xl mx-auto">
            <div className="relative aspect-video">
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  <p className="text-lg">Quick Start Video</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <p className="text-gray-700 mb-6">
            Our support team is here to ensure your success. Don&apos;t hesitate to reach out!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = 'mailto:support@example.com'}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Email Support
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://example.com/community', '_blank')}
            >
              Join Community
            </Button>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-4">
            <strong>Remember:</strong> You have a 30-day money-back guarantee. 
            We&apos;re confident you&apos;ll love what&apos;s inside!
          </p>
          <p>
            Transaction ID: #DEMO-{Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}