'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CalendarBooking from '@/components/calendar-booking';

export default function SchedulePage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Track page visit
    const trackVisit = async () => {
      await supabase
        .from('funnel_analytics')
        .insert({
          page_visited: 'schedule',
          timestamp: new Date().toISOString()
        });
    };
    trackVisit();
  }, [supabase]);



  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <div className="flex justify-center pt-8 pb-4 px-8">
        <img src="/image.png" alt="Logo" width={180} height={45} />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Main Headline */}
        <div className="mb-12 mt-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black md:font-bold text-gray-900 leading-6 md:leading-tight mb-6">
            <span className="md:hidden">Schedule Your Reality<br />Management™ Certification Call And<br />Start Giving Professional Astrology<br />Readings In 4 Months</span>
            <span className="hidden md:inline">Schedule Your Reality Management™<br />
            Certification Call And Start Giving<br />
            Professional Astrology Readings In 4 Months</span>
          </h1>
          <p className="text-sm md:text-xl text-black mb-2 text-center">
            <span className="font-black">WARNING:</span> The Calendar Tool May Take 10-15 Seconds To Load
          </p>
        </div>

        {/* Calendar Section */}
        <div className="w-full max-w-none mx-auto px-0 flex justify-center">
          <CalendarBooking 
            onSuccess={() => {
              router.push('/v/confirmed');
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 py-12 mt-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/image.png" alt="Logo" width={140} height={35} />
          </div>
          
          {/* Copyright and Links */}
          <div className="text-xs text-gray-500 space-y-2">
            <p>© 2025 AstroForYou. All rights reserved.</p>
            
            <div className="flex justify-center space-x-6 mt-4">
              <a href="/privacy-policy" className="hover:text-gray-700">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-700">Terms & Conditions</a>
              <a href="/disclaimer" className="hover:text-gray-700">Disclaimer</a>
            </div>
            
            <div className="mt-6 leading-relaxed max-w-3xl mx-auto">
              <p>
                This website is operated and maintained by Hyperscale Media LLC. Use of this website is governed by its Terms Of Service 
                and Privacy Policy. The training provided is general in nature, and some strategies may not be appropriate for all 
                individuals or all situations. We make no representation regarding the likelihood or probability that any actual or 
                hypothetical investment will achieve a particular outcome or perform in any predictable manner.
              </p>
              
              <p className="mt-4">
                Hyperscale Media LLC • 400 Bela Blvd, Monticello NY 10901
              </p>
              
              <p className="mt-4">
                We use cookies to help improve, promote and protect our services. By continuing to use this site, you agree to our privacy 
                policy and terms of use. This site is not a part of Facebook website or Facebook, Inc. This site is NOT endorsed by 
                Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}