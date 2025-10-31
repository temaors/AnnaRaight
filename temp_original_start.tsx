'use client';

import { useRouter } from 'next/navigation';
import LeadCaptureForm from '@/components/lead-capture-form';

export default function StartPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <div className="flex justify-center md:justify-start px-8 -mt-4">
        <img src="/image.png" alt="Logo" width={220} height={55} />
      </div>

      {/* Target Audience */}
      <div className="text-center -mt-6 md:-mt-14" style={{marginBottom: '0.5cm'}}>
        <p className="text-black text-base leading-tight">Zero-Risk Astrology Certification Opportunity</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">

        {/* Main Headline */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black md:font-bold text-gray-900 leading-none md:leading-tight" style={{marginBottom: '0.5cm'}}>
            <span className="hidden md:inline">&ldquo;</span>Deliver Professional-Grade Astrology Readings That <span className="text-purple-600"><span className="md:hidden text-purple-600">&ldquo;</span>You Can Charge For<span className="md:hidden text-purple-600">&rdquo;</span></span> In 4 Months And Transform People&apos;s <span className="block md:inline">Lives... Or You Don&apos;t Pay!</span><span className="hidden md:inline">&rdquo;</span>
          </h1>
          <p className="text-sm md:text-2xl text-black italic font-light md:font-normal leading-none md:leading-normal" style={{marginBottom: '2cm'}}>
            ...Using The Only Mathematically-Proven Astrology System Recognized By Scientists
          </p>
        </div>

        {/* Main Content Section */}
        <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
          {/* Left Column - Speaker Image */}
          <div className="relative hidden lg:block">
            <div className="bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              {/* Speaker Image */}
              <div className="aspect-video relative">
                <img 
                  src="/speaker.jpg" 
                  alt="Anna Raight - Master of Astrology"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Caption under image */}
            <p className="text-xs text-black mt-3 leading-none md:leading-tight font-light text-center">
              Anna Raight, Master of Astrology, founder of AstroForYou professional astrological service to 95,000 users while serving 5,000+ clients across 40 countries. She&apos;s certified 400+ practitioners now earning $5,000-$15,000/month from home. In this training, she shares the Reality Management method creating a new generation of professional astrologers.
            </p>
          </div>

          {/* Right Column - Lead Capture Form */}
          <div className="bg-white -mt-14 lg:mt-0">
            <div className="mb-1 lg:mb-6 text-center lg:text-left">
              <h3 className="text-xs lg:text-lg font-black lg:font-extrabold text-gray-900 mb-1 leading-none md:leading-tight lg:pl-12">
                <span className="block lg:inline">Enter your name & email below to see</span>
                <span className="block lg:inline"> 100% Free<br className="hidden lg:block" />Training</span>
              </h3>
            </div>

            <div className="-mt-4 lg:-mt-14">
              <LeadCaptureForm
                title=""
                subtitle=""
                buttonText="GET INSTANT ACCESS"
                sendVideoEmail={true}
                videoUrl="/funnel/watch"
                onSuccess={(email, firstName) => {
                  // Navigate to watch page with parameters
                  router.push(`/funnel/watch?firstName=${encodeURIComponent(firstName)}&email=${encodeURIComponent(email)}`);
                }}
              />
            </div>
            
            <p className="text-black font-normal text-center leading-none md:hidden" style={{fontSize: '6px', marginTop: '0px'}}>
              Your information is private &amp; secure. We will never spam or annoy you.
            </p>
            <p className="hidden md:block text-black font-light text-center leading-normal -mt-3" style={{fontSize: '10px'}}>
              Your information is private &amp; secure. We will never spam or annoy you.
            </p>
          </div>
        </div>

        {/* Media Logos Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-8">
            <img src="/inastros.png" alt="Inastros" className="h-16 md:h-20 object-contain" />
            <img src="/astroforyou.png" alt="AstroForYou" className="h-24 md:h-28 object-contain" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/image.png" alt="Logo" width={140} height={35} />
          </div>
          
          {/* Copyright and Links */}
          <div className="text-xs text-gray-500 space-y-2">
            <p>Copyright 2025 FunnelMaster LLC. All rights reserved.</p>
            
            <div className="flex justify-center space-x-6 mt-4">
              <a href="#" className="hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700">Terms & Conditions</a>
              <a href="#" className="hover:text-gray-700">Disclaimer</a>
            </div>
            
            <div className="mt-6 leading-relaxed max-w-3xl mx-auto">
              <p>
                This website is operated and maintained by FunnelMaster LLC. Use of this website is governed by its Terms Of Service 
                and Privacy Policy. The training provided is general in nature, and some strategies may not be appropriate for all 
                individuals or all situations. We make no representation regarding the likelihood of profitability that any actual or 
                prospective client will experience.
              </p>
              
              <p className="mt-4">
                FunnelMaster LLC • 400 Best Blvd, Huntington NY 19087
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