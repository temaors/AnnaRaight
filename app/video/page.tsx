'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

// Format time helper function
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function WatchPage() {
  const router = useRouter();
  const supabase = createClient();

  // Custom Video Player Component
  const CustomVideoPlayer = ({ videoSrc, className = "" }: {
    videoSrc: string;
    className?: string;
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isPreviewActiveRef = useRef(false);
    
    // Local state instead of global state
    const [localState, setLocalState] = useState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isMuted: false,
      isPreview: false,
      lastPlaybackPosition: 0,
      isLoading: true
    });
    
    const progressPercentage = localState.duration > 0 ? (localState.currentTime / localState.duration) * 100 : 0;

    // Preview functionality
    const startPreview = () => {
      if (videoRef.current && !localState.isPlaying) {
        console.log('Starting preview for main video');
        isPreviewActiveRef.current = true;
        setLocalState(prev => ({ ...prev, isPreview: true }));
        // Only reset to 0 for initial preview, not when resuming
        if (localState.lastPlaybackPosition === 0) {
          videoRef.current.currentTime = 0;
        }
        videoRef.current.muted = true;
        videoRef.current.play().catch(err => console.log('Preview play failed:', err));
        
        // Clear any existing timer
        if (previewTimerRef.current) {
          clearTimeout(previewTimerRef.current);
        }
        
        // Start the continuous preview loop
        const scheduleNextPreview = () => {
          previewTimerRef.current = setTimeout(() => {
            console.log('Timer triggered for main video, isPreviewActive:', isPreviewActiveRef.current);
            if (videoRef.current && isPreviewActiveRef.current) {
              console.log('Pausing and restarting 5-second preview loop for main video');
              videoRef.current.pause();
              // Only reset to 0 for preview loop, don't affect main playback position
              if (localState.lastPlaybackPosition === 0) {
                videoRef.current.currentTime = 0;
              }
              setTimeout(() => {
                if (videoRef.current && isPreviewActiveRef.current) {
                  videoRef.current.play().catch(err => console.log('Preview restart failed:', err));
                }
              }, 500); // 0.5 second pause before restart
              scheduleNextPreview(); // Schedule the next loop
            }
          }, 5000); // Wait 5 seconds then pause and restart
        };
        
        scheduleNextPreview();
      }
    };

    const stopPreview = () => {
      if (videoRef.current && localState.isPreview) {
        console.log('Manually stopping preview for main video');
        // Clear the timer
        isPreviewActiveRef.current = false;
        if (previewTimerRef.current) {
          clearTimeout(previewTimerRef.current);
          previewTimerRef.current = null;
        }
        videoRef.current.pause();
        // Don't reset position - preserve where user was
        setLocalState(prev => ({ ...prev, isPreview: false, isPlaying: false }));
      }
    };

    // Local play/pause handler
    const handleLocalPlayPause = async () => {
      console.log('Local play button clicked for main video');
      if (!videoRef.current) {
        console.log('No video ref for main video');
        return;
      }
      
      const video = videoRef.current;
      console.log('Video element found, paused:', video.paused);
      
      try {
        if (video.paused || localState.isPreview) {
          // Stop any preview mode
          isPreviewActiveRef.current = false;
          if (previewTimerRef.current) {
            clearTimeout(previewTimerRef.current);
            previewTimerRef.current = null;
          }
          setLocalState(prev => ({ ...prev, isPreview: false }));
          
          // Resume from last position instead of resetting to 0
          video.currentTime = localState.lastPlaybackPosition;
          video.muted = false;
          setLocalState(prev => ({ ...prev, isMuted: false }));
          
          console.log('Starting full video playback from position:', localState.lastPlaybackPosition);
          try {
            await video.play();
          } catch (error) {
            console.log('Play failed, trying muted:', error);
            video.muted = true;
            setLocalState(prev => ({ ...prev, isMuted: true }));
            await video.play();
          }
        } else {
          // Save current position before pausing
          setLocalState(prev => ({ ...prev, lastPlaybackPosition: video.currentTime }));
          video.pause();
        }
      } catch (error) {
        console.error('Video play error for main video:', error);
      }
    };

    // Auto-start preview when component loads
    useEffect(() => {
      const timer = setTimeout(() => {
        startPreview();
      }, 500); // Small delay to ensure video is loaded
      
      return () => clearTimeout(timer);
    }, []);

    // Handle fullscreen changes for Android and iOS
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleFullscreenChange = () => {
        if (!videoRef.current) return;

        const isFullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).webkitCurrentFullScreenElement ||
          (document as any).msFullscreenElement ||
          (document as any).mozFullScreenElement
        );

        console.log('Fullscreen change detected, isFullscreen:', isFullscreen);

        // Enable native controls in fullscreen for better compatibility
        if (isFullscreen) {
          console.log('Enabling controls for fullscreen');
          videoRef.current.setAttribute('controls', 'true');
          // Also disable pointer-events restriction in fullscreen
          videoRef.current.style.pointerEvents = 'auto';
        } else {
          console.log('Disabling controls, exiting fullscreen');
          videoRef.current.removeAttribute('controls');
          videoRef.current.style.pointerEvents = 'none';
        }
      };

      const handleWebkitBeginFullscreen = () => {
        console.log('iOS fullscreen begin');
        if (videoRef.current) {
          videoRef.current.setAttribute('controls', 'true');
          videoRef.current.style.pointerEvents = 'auto';
        }
      };

      const handleWebkitEndFullscreen = () => {
        console.log('iOS fullscreen end');
        if (videoRef.current) {
          videoRef.current.removeAttribute('controls');
          videoRef.current.style.pointerEvents = 'none';
        }
      };

      // Standard fullscreen events
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      // iOS fullscreen events
      video.addEventListener('webkitbeginfullscreen', handleWebkitBeginFullscreen);
      video.addEventListener('webkitendfullscreen', handleWebkitEndFullscreen);

      // Trigger check on mount in case already in fullscreen
      handleFullscreenChange();

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

        if (video) {
          video.removeEventListener('webkitbeginfullscreen', handleWebkitBeginFullscreen);
          video.removeEventListener('webkitendfullscreen', handleWebkitEndFullscreen);
        }
      };
    }, []);

    // Cleanup video on unmount to prevent memory leaks
    useEffect(() => {
      return () => {
        // Clear preview timer and stop preview
        isPreviewActiveRef.current = false;
        if (previewTimerRef.current) {
          clearTimeout(previewTimerRef.current);
        }
        // Cleanup video
        if (videoRef.current) {
          try {
            videoRef.current.pause();
            videoRef.current.src = '';
            videoRef.current.load();
          } catch (error) {
            console.log('Video cleanup error:', error);
          }
        }
      };
    }, []);

    return (
      <div 
        className={`relative bg-black group overflow-hidden aspect-video cursor-pointer ${className}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleLocalPlayPause();
          }
        }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster="/speaker.jpg"
          preload="metadata"
          playsInline
          className="w-full h-full object-contain"
          style={{ pointerEvents: 'none' }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              const currentTime = videoRef.current.currentTime;
              setLocalState(prev => ({ 
                ...prev, 
                currentTime,
                // Update last playback position during normal playback (not preview)
                lastPlaybackPosition: localState.isPreview ? prev.lastPlaybackPosition : currentTime
              }));
              
              // Note: Preview time limit is now handled by timer, not onTimeUpdate
              // This prevents conflicts between timer and onTimeUpdate logic
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setLocalState(prev => ({ ...prev, duration: videoRef.current!.duration }));
            }
          }}
          onPlay={() => {
            // Don't change isPlaying state during preview mode
            if (!localState.isPreview) {
              setLocalState(prev => ({ ...prev, isPlaying: true }));
            }
          }}
          onPause={() => {
            // Don't change isPlaying state during preview mode pause
            if (!localState.isPreview) {
              setLocalState(prev => ({ ...prev, isPlaying: false }));
            }
          }}
          onError={(e) => {
            console.error('Video error for main video:', e);
            console.error('Video src:', videoSrc);
            setLocalState(prev => ({ ...prev, isPlaying: false }));
          }}
          onLoadedData={() => {
            console.log('Video loaded successfully for main video');
            setLocalState(prev => ({ ...prev, isLoading: false }));
          }}
          onLoadStart={() => {
            console.log('Video loading started');
            setLocalState(prev => ({ ...prev, isLoading: true }));
          }}
          onWaiting={() => {
            setLocalState(prev => ({ ...prev, isLoading: true }));
          }}
          onCanPlay={() => {
            setLocalState(prev => ({ ...prev, isLoading: false }));
          }}
        />

        {/* Loading Spinner */}
        {localState.isLoading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 60000 }}>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
          </div>
        )}

        {/* Center Play Button - Visible when not playing full video or during preview */}
        {(!localState.isPlaying || localState.isPreview) && !localState.isLoading && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLocalPlayPause();
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-16 rounded flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(92, 28, 119, 0.9)',
              zIndex: 50000,
              pointerEvents: 'auto',
              position: 'absolute',
              animation: 'pulse 3s ease-in-out infinite'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(92, 28, 119, 1)';
            }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(92, 28, 119, 0.9)'}
          >
            <svg className="w-8 h-8 text-white ml-1" fill="white" viewBox="0 0 24 24" style={{ pointerEvents: 'none' }}>
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )}

        {/* Controls Container */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[40px] transition-all duration-300 opacity-100"
          style={{ backgroundColor: 'rgba(92, 28, 119, 0.7)', zIndex: 9000 }}
        >
          <div className="flex items-center justify-between px-4 h-full relative">
            {/* Progress Bar */}
            <div className="absolute left-24 right-24 top-1/2 transform -translate-y-1/2 h-1 bg-white/20">
              <div className="absolute left-0 top-0 h-full bg-white transition-all duration-100" style={{ width: `${progressPercentage}%` }} />
              
              {/* Time Display */}
              <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium">
                {formatTime(localState.currentTime)}
              </div>
              
              {/* Progress Indicator */}
              <div className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full" style={{ left: `calc(${progressPercentage}% - 4px)` }} />
            </div>

            {/* Left Controls */}
            <div className="flex items-center gap-4 relative z-20">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLocalPlayPause();
                }}
                className="text-white hover:text-white/80 transition-colors"
              >
                {localState.isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 relative z-20">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.muted = !videoRef.current.muted;
                    setLocalState(prev => ({ ...prev, isMuted: videoRef.current!.muted }));
                  }
                }}
                className="text-white hover:text-white/80 transition-colors"
              >
                {localState.isMuted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (videoRef.current) {
                    const video = videoRef.current as any;

                    // IMPORTANT: Stop preview mode before entering fullscreen
                    isPreviewActiveRef.current = false;
                    if (previewTimerRef.current) {
                      clearTimeout(previewTimerRef.current);
                      previewTimerRef.current = null;
                    }
                    setLocalState(prev => ({ ...prev, isPreview: false }));

                    // Check if we're on iOS Safari
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

                    if (isIOS) {
                      // iOS Safari requires webkitEnterFullscreen on the video element
                      if (video.webkitEnterFullscreen) {
                        try {
                          video.webkitEnterFullscreen();
                        } catch (err) {
                          console.log('iOS fullscreen error:', err);
                        }
                      } else if (video.webkitRequestFullscreen) {
                        video.webkitRequestFullscreen();
                      }
                    } else {
                      // Standard fullscreen API for other browsers
                      const isCurrentlyFullscreen = !!(
                        document.fullscreenElement ||
                        (document as any).webkitFullscreenElement ||
                        (document as any).msFullscreenElement ||
                        (document as any).mozFullScreenElement
                      );

                      if (isCurrentlyFullscreen) {
                        // Exit fullscreen with cross-browser support
                        if (document.exitFullscreen) {
                          document.exitFullscreen();
                        } else if ((document as any).webkitExitFullscreen) {
                          (document as any).webkitExitFullscreen();
                        } else if ((document as any).msExitFullscreen) {
                          (document as any).msExitFullscreen();
                        } else if ((document as any).mozCancelFullScreen) {
                          (document as any).mozCancelFullScreen();
                        }
                      } else {
                        // Enter fullscreen with cross-browser support
                        if (video.requestFullscreen) {
                          video.requestFullscreen().catch(err => {
                            console.log('Fullscreen error:', err);
                          });
                        } else if (video.webkitRequestFullscreen) {
                          video.webkitRequestFullscreen();
                        } else if (video.msRequestFullscreen) {
                          video.msRequestFullscreen();
                        } else if (video.mozRequestFullScreen) {
                          video.mozRequestFullScreen();
                        }
                      }
                    }
                  }
                }}
                className="text-white hover:text-white/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
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
                <CustomVideoPlayer
                  videoSrc="/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FANNA%2BRAIGHT%2BVSL%2BV3.mp4"
                  className="w-full h-full"
                />
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
  );
}