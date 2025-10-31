'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function WatchPage() {
  const router = useRouter();
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize video when component mounts
  useEffect(() => {
    if (videoRef.current && isMountedRef.current) {
      // Reset video state
      videoRef.current.currentTime = 0;
      videoRef.current.volume = 1;
      videoRef.current.muted = false;
    }
  }, []);

  useEffect(() => {
    // Track page visit
    const trackVisit = async () => {
      await supabase
        .from('funnel_analytics')
        .insert({
          page_visited: 'watch',
          timestamp: new Date().toISOString()
        });
    };
    trackVisit();

    // Cleanup function
    return () => {
      if (videoRef.current && isMountedRef.current) {
        try {
          videoRef.current.pause();
        } catch (error) {
          console.log('Error during cleanup:', error);
        }
      }
    };
  }, [supabase]);

  const handleCTAClick = () => {
    router.push('/funnel/schedule');
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <div className="flex justify-center -mt-8 md:pt-1 pb-4 px-8">
        <img src="/image.png" alt="Logo" width={180} height={45} />
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 text-center">
        {/* Pre-headline */}
        <div className="mb-2 -mt-16">
          <p className="text-black text-base md:text-2xl font-normal">Zero-Risk Astrology Certification Opportunity:</p>
        </div>

        {/* Headline */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-2 md:mb-6 leading-tight">
            Discover How To Master <span className="text-purple-600 whitespace-nowrap">&quot;Reality Management™&quot;</span> And Start Giving Professional Astrology Readings In 4 Months... Guaranteed!
          </h1>
          <p className="text-sm md:text-xl text-black">
            Watch The Video Below To See How It Works
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-12">
          {/* Video Container */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="overflow-hidden">
              <div className="relative bg-black rounded-2xl md:border-8 md:border-gray-900 overflow-hidden">
                <video
                  src="https://astroforyou.s3.us-east-2.amazonaws.com/ANNA+RAIGHT+VSL+V3.mp4"
                  poster="/speaker.jpg"
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Уровни блокировки (выберите один):
              
              Уровень 1 - Обычный YouTube:
              <VideoPlayer youtubeId="dQw4w9WgXcQ" />
              
              Уровень 2 - Скрытый YouTube:
              <StealthVideoPlayer youtubeId="dQw4w9WgXcQ" />
              
              Уровень 3 - Максимальное скрытие:
              <UltraStealthPlayer youtubeId="dQw4w9WgXcQ" />
              
              Уровень 4 - ЗАБЛОКИРОВАНО (текущий):
              <LockedVideoPlayer youtubeId="dQw4w9WgXcQ" />
              
              */}
            </div>
          </div>


          {/* CTA Section */}
          <div className="max-w-4xl mx-auto -mt-4">
            <p className="text-sm md:text-xl text-black mb-6 leading-tight md:leading-normal text-center tracking-tight md:tracking-normal">
              If you&apos;re <span className="font-black">READY TO BECOME A <span className="underline">CERTIFIED ASTROLOGER</span></span> or at the very least <span className="font-black">CURIOUS ABOUT TRANSFORMING LIVES WITH SCIENTIFIC ASTROLOGY</span> – book a consultation below and we&apos;ll show you the Reality Management™ system that lets you charge for your reading in 4 months.
            </p>

            <Button 
              onClick={handleCTAClick}
              className="w-full h-24 bg-purple-600 hover:bg-purple-700 text-white text-base md:text-4xl font-black uppercase tracking-tight md:tracking-wide rounded-none px-4"
            >
              SCHEDULE A CONSULTATION HERE
            </Button>
          </div>

          {/* Logo Section - Mobile Only */}
          <div className="mt-4 mb-2 md:hidden">
            <div className="flex justify-center items-center space-x-4">
              <img src="/inastros.png" alt="Inastros" className="h-12 object-contain" />
              <img src="/image.png" alt="AstroForYou" className="h-16 object-contain" />
              <img src="/photo1.png" alt="Photo 1" className="h-12 object-contain" />
              <img src="/photo2.png" alt="Photo 2" className="h-12 object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-2 md:py-12 mt-2 md:mt-24">
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