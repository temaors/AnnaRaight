'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import Script from 'next/script';

export default function WatchPage() {
  const router = useRouter();
  const supabase = createClient();

  // Wistia Video Player Component
  const WistiaVideoPlayer = ({ className = "" }: {
    className?: string;
  }) => {
    return (
      <div className={`relative bg-black overflow-hidden aspect-video ${className}`}>
        <style dangerouslySetInnerHTML={{
          __html: `
            wistia-player[media-id='c2ubn3nb52']:not(:defined) {
              background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/c2ubn3nb52/swatch');
              display: block;
              filter: blur(5px);
              padding-top: 56.25%;
            }
          `
        }} />
        <wistia-player
          media-id="c2ubn3nb52"
          seo="false"
          aspect="1.7777777777777777"
          className="w-full h-full"
        ></wistia-player>
      </div>
    );
  };

  useEffect(() => {
    // Set page title
    document.title = "AstroForYou - School of Astrology by Anna Raight";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'AstroForYou - School of Astrology by Anna Raight');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'AstroForYou - School of Astrology by Anna Raight';
      document.head.appendChild(meta);
    }
    
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
  }, [supabase]);

  const handleCTAClick = () => {
    router.push('/schedule/');
  };

  return (
    <>
      {/* Load Wistia Scripts */}
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script src="https://fast.wistia.com/embed/c2ubn3nb52.js" type="module" strategy="afterInteractive" />

      <div className="min-h-screen bg-white">
        {/* Header with Logo */}
        <div className="flex justify-center mt-4 md:mt-0 md:pt-6 pb-4 px-8">
          <img src="/image.png" alt="Logo" width={200} height={50} />
        </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 text-center">
        {/* Pre-headline */}
        <div className="mb-2">
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
                <WistiaVideoPlayer className="w-full h-full" />
              </div>
            </div>
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

      </div>

      {/* Footer */}
      <div className="bg-white py-12 mt-24">
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
                This website is operated and maintained by AstroForYou. Use of this website is governed by its Terms Of Service 
                and Privacy Policy. The training provided is general in nature, and some strategies may not be appropriate for all 
                individuals or all situations. We make no representation regarding the likelihood of profitability that any actual or 
                prospective client will experience.
              </p>
              
              <p className="mt-4">
                AstroForYou • Melbourne, Australia, 56 Evesham Drive, Point Cook VIC 3030
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
    </>
  );
}