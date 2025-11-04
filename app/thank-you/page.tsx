'use client';

import { useEffect, useState, Suspense, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { parseISO } from 'date-fns';
import Script from 'next/script';
import {
  formatTime,
  toggleFullscreen,
  isFullscreen,
  calculateSeekTime
} from '@/lib/videoUtils';
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  FullscreenIcon,
  LoadingSpinner
} from '@/components/ui/VideoIcons';
import { useVideoFullscreen } from '@/hooks/useVideoFullscreen';
import { useVideoSeeking } from '@/hooks/useVideoSeeking';
import { TestimonialCard } from '@/components/TestimonialCard';

function ConfirmedPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, setAppointmentDate] = useState<Date | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Force page reload if loaded from cache (bfcache)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was loaded from bfcache (back-forward cache)
        console.log('Page loaded from cache, forcing reload...');
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Force fresh page load by adding timestamp to URL if it's not already present
  useEffect(() => {
    if (pageLoaded) return; // Prevent infinite loop

    const currentUrl = new URL(window.location.href);
    const hasTimestamp = currentUrl.searchParams.has('_t');
    const hasCalendlyParams = currentUrl.searchParams.has('assigned_to') ||
                              currentUrl.searchParams.has('event_type_uuid') ||
                              currentUrl.searchParams.has('invitee_email');

    // If Calendly redirected us here (has Calendly params) but no timestamp, add it and reload
    if (hasCalendlyParams && !hasTimestamp) {
      console.log('Calendly redirect detected, adding timestamp to force fresh load...');
      currentUrl.searchParams.set('_t', Date.now().toString());
      window.location.replace(currentUrl.toString());
      return;
    }

    setPageLoaded(true);
  }, [pageLoaded]);

  // Video data with direct S3 URLs - memoized to prevent re-renders
  const testimonialVideos = useMemo(() => [
    {
      id: 'julia',
      name: 'Julia',
      file: '/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FIMG_1054.mp4',
      title: 'Amazing Results with Astrology Course',
      subtitle: '(Life-Changing Experience)',
      duration: '1:49',
      color: 'purple',
      startTime: 0,
      poster: '/video-previews/julia.jpg',
      quote: '"Thank you, my teacher, for teaching me not just analytics, but also self-confidence and a desire to help people."',
      avatarLetter: 'S',
      wistiaMediaId: '09txw2012g'
    },
    {
      id: 'valeria',
      name: 'Valeria',
      file: '/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FIMG_1041.mp4',
      title: 'How I Scaled A Coaching Business In 90 Days',
      subtitle: '(Using A Fully Automated Webinar Funnel)',
      duration: '1:30',
      color: 'purple',
      startTime: 0,
      poster: '/video-previews/valeria.jpg',
      quote: '"I recommend this course"',
      avatarLetter: 'Z'
    },
    {
      id: 'irina',
      name: 'Irina',
      file: '/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FIMG_1040.mp4',
      title: 'Complete Business Transformation In Just 90 Days',
      subtitle: '(Complete Business Transformation)',
      duration: '3:00',
      color: 'purple',
      startTime: 0,
      poster: '/video-previews/irina.jpg',
      quote: '"She is a teacher with a big heart."',
      avatarLetter: 'O'
    },
    {
      id: 'olga',
      name: 'Olga',
      file: '/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FIMG_1038.mp4',
      title: 'How I Built A 6-Figure Consulting Business In 6 Months',
      subtitle: '(Starting With Zero Experience)',
      duration: '1:40',
      color: 'purple',
      startTime: 0,
      poster: '/video-previews/olga.jpg',
      quote: '"The way she delivers the material is amazing!"',
      avatarLetter: 'M'
    },
    {
      id: 'zhenya',
      name: 'Zhenya',
      file: '/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FIMG_1036.mp4',
      title: 'From Freelancer To Agency Owner',
      subtitle: '(Building A Scalable Business Model)',
      duration: '2:20',
      color: 'purple',
      startTime: 0,
      poster: '/video-previews/zhenya.jpg',
      quote: '"I wholeheartedly recommend her school."',
      avatarLetter: 'V',
      wistiaMediaId: 'v6p9r70tof'
    },
    {
      id: 'olga2',
      name: 'Olga',
      file: '/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FIMG_1037.mp4',
      title: 'The Knowledge Revolution',
      subtitle: '(Transforming Lives Through Learning)',
      duration: '1:50',
      color: 'purple',
      startTime: 0,
      poster: '/video-previews/olga2.jpg',
      quote: '"Now I know exactly who I am and what I want. I don\'t need any rituals for that — astrology has already revealed everything… and more."',
      avatarLetter: 'A'
    },
    {
      id: 'vladimir',
      name: 'Vladimir',
      file: '/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FIMG_1039.mp4',
      title: 'From Freelancer To Agency Owner',
      subtitle: '(Building A Scalable Business Model)',
      duration: '0:49',
      color: 'purple',
      startTime: 0,
      poster: '/video-previews/vladimir.jpg',
      quote: '"I believe that astrology deserves much more attention in a person\'s life..."',
      avatarLetter: 'D'
    }
  ], []);

  const openVideoModal = (videoFile: string) => {
    setSelectedVideo(videoFile);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  // Wistia Video Player Component
  const WistiaVideoPlayer = ({ mediaId, className = "" }: {
    mediaId: string;
    className?: string;
  }) => {
    return (
      <div className={`relative bg-black overflow-hidden aspect-video ${className}`}>
        <style dangerouslySetInnerHTML={{
          __html: `
            wistia-player[media-id='${mediaId}']:not(:defined) {
              background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${mediaId}/swatch');
              display: block;
              filter: blur(5px);
              padding-top: 56.25%;
            }
          `
        }} />
        <wistia-player
          media-id={mediaId}
          seo="false"
          aspect="1.7777777777777777"
          className="w-full h-full"
        ></wistia-player>
      </div>
    );
  };

  // Custom Video Player Component with local state
  const CustomVideoPlayer = ({ videoSrc, startTime = 0, videoId, className = "", autoPreload = false, poster }: {
    videoSrc: string;
    startTime?: number;
    videoId: string;
    className?: string;
    autoPreload?: boolean;
    poster?: string;
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isPreviewActiveRef = useRef(false);
    const lastAllowedTimeRef = useRef(0);

    // Use custom hooks for video behavior
    useVideoFullscreen(videoRef);
    useVideoSeeking(videoRef, videoId, lastAllowedTimeRef);

    // Local state instead of global state
    const [localState, setLocalState] = useState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isMuted: false,
      isPreview: false,
      isDragging: false,
      isLoading: true
    });
    
    const effectiveDuration = localState.duration || (videoRef.current?.duration || 0);
    const progressPercentage = effectiveDuration > 0 ? (localState.currentTime / effectiveDuration) * 100 : 0;

    // Force metadata loading on mount for all videos
    useEffect(() => {
      const timer = setTimeout(() => {
        if (videoRef.current) {
          console.log('Forcing metadata load for:', videoId, 'readyState:', videoRef.current.readyState);
          // Always call load() to ensure video starts loading
          videoRef.current.load();
        }
      }, 100); // Small delay to ensure video element is ready

      return () => clearTimeout(timer);
    }, [videoId]);

    // Preview functionality - only for main-vsl video
    const startPreview = () => {
      if (videoRef.current && !localState.isPlaying && videoId === "main-vsl") {
        const baseId = videoId.split('-')[0];
        const videoData = testimonialVideos.find(v => v.id === baseId);
        const startTime = videoData?.startTime || 0;
        
        console.log('Starting preview for', videoId);
        isPreviewActiveRef.current = true;
        setLocalState(prev => ({ ...prev, isPreview: true }));
        videoRef.current.currentTime = startTime;
        videoRef.current.muted = true;
        videoRef.current.play().catch(err => console.log('Preview play failed:', err));
        
        // Clear any existing timer
        if (previewTimerRef.current) {
          clearTimeout(previewTimerRef.current);
        }
        
        // Start the continuous preview loop
        const scheduleNextPreview = () => {
          previewTimerRef.current = setTimeout(() => {
            console.log('Timer triggered for', videoId, 'isPreviewActive:', isPreviewActiveRef.current);
            // Only continue preview loop if still in preview mode (checked via ref to avoid stale closure)
            if (videoRef.current && isPreviewActiveRef.current) {
              console.log('Pausing and restarting 5-second preview loop for', videoId);
              videoRef.current.pause();
              videoRef.current.currentTime = startTime;
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
      if (videoRef.current && localState.isPreview && videoId === "main-vsl") {
        const baseId = videoId.split('-')[0];
        const videoData = testimonialVideos.find(v => v.id === baseId);
        const startTime = videoData?.startTime || 0;
        
        console.log('Manually stopping preview for', videoId);
        // Clear the timer
        isPreviewActiveRef.current = false;
        if (previewTimerRef.current) {
          clearTimeout(previewTimerRef.current);
          previewTimerRef.current = null;
        }
        videoRef.current.pause();
        videoRef.current.currentTime = startTime;
        setLocalState(prev => ({ ...prev, isPreview: false, isPlaying: false }));
      }
    };

    // Local play/pause handler - works for all videos
    const handleLocalPlayPause = async () => {
      
      console.log('Local play button clicked for', videoId);
      if (!videoRef.current) {
        console.log('No video ref for', videoId);
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

          // Set start time only if video is at the beginning or in preview
          const baseId = videoId.split('-')[0];
          const videoData = testimonialVideos.find(v => v.id === baseId);
          // Only reset to startTime if we're at the very beginning (first 1 second)
          if (videoData && videoData.startTime > 0 && video.currentTime < 1) {
            video.currentTime = videoData.startTime;
          }
          video.muted = false;
          setLocalState(prev => ({ ...prev, isMuted: false }));
          
          console.log('Starting full video playback for', videoId);
          try {
            await video.play();
          } catch (error) {
            console.log('Play failed, trying muted:', error);
            video.muted = true;
            setLocalState(prev => ({ ...prev, isMuted: true }));
            await video.play();
          }
        } else {
          video.pause();
        }
      } catch (error) {
        console.error('Video play error for', videoId, ':', error);
      }
    };

    // Seeking functionality - only for testimonial videos (not main-vsl)
    const isSeekingEnabled = videoId !== "main-vsl";

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
      console.log('Progress bar clicked for:', videoId, {
        isSeekingEnabled,
        hasVideoRef: !!videoRef.current,
        duration: localState.duration,
        videoDuration: videoRef.current?.duration,
        hasCurrentTarget: !!e.currentTarget
      });

      // Use video duration as fallback if local state duration is 0
      const currentDuration = localState.duration || (videoRef.current?.duration || 0);

      if (!isSeekingEnabled || !videoRef.current || currentDuration === 0 || !e.currentTarget) return;

      const newTime = calculateSeekTime(e.clientX, e.currentTarget, currentDuration);

      console.log('Seeking to:', newTime, 'seconds for video:', videoId, 'using duration:', currentDuration);
      videoRef.current.currentTime = newTime;
      setLocalState(prev => ({ ...prev, currentTime: newTime }));
    };

    const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSeekingEnabled || !videoRef.current || !e.currentTarget) return;
      
      setLocalState(prev => ({ ...prev, isDragging: true }));
      
      const progressBarElement = e.currentTarget;
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentDuration = localState.duration || (videoRef.current?.duration || 0);
        if (!videoRef.current || currentDuration === 0 || !progressBarElement) return;

        const newTime = calculateSeekTime(moveEvent.clientX, progressBarElement, currentDuration);

        videoRef.current.currentTime = newTime;
        setLocalState(prev => ({ ...prev, currentTime: newTime }));
      };
      
      const handleMouseUp = () => {
        setLocalState(prev => ({ ...prev, isDragging: false }));
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault(); // Prevent scrolling during drag
        const currentDuration = localState.duration || (videoRef.current?.duration || 0);
        if (!videoRef.current || currentDuration === 0 || !progressBarElement) return;

        const touch = moveEvent.touches[0];
        if (!touch) return;

        const newTime = calculateSeekTime(touch.clientX, progressBarElement, currentDuration);

        videoRef.current.currentTime = newTime;
        setLocalState(prev => ({ ...prev, currentTime: newTime }));
      };

      const handleTouchEnd = () => {
        setLocalState(prev => ({ ...prev, isDragging: false }));
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    };

    // Touch start handler for mobile
    const handleProgressBarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isSeekingEnabled || !videoRef.current || !e.currentTarget) return;

      e.preventDefault(); // Prevent mouse events from firing

      // Handle touch as click first
      const currentDuration = localState.duration || (videoRef.current?.duration || 0);
      if (currentDuration === 0) return;

      const touch = e.touches[0];
      if (!touch) return;

      const newTime = calculateSeekTime(touch.clientX, e.currentTarget, currentDuration);

      console.log('Touch seeking to:', newTime, 'seconds for video:', videoId);
      videoRef.current.currentTime = newTime;
      setLocalState(prev => ({ ...prev, currentTime: newTime, isDragging: true }));

      // Now setup drag handlers
      const progressBarElement = e.currentTarget;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault(); // Prevent scrolling during drag
        const currentDuration = localState.duration || (videoRef.current?.duration || 0);
        if (!videoRef.current || currentDuration === 0 || !progressBarElement) return;

        const touch = moveEvent.touches[0];
        if (!touch) return;

        const newTime = calculateSeekTime(touch.clientX, progressBarElement, currentDuration);

        videoRef.current.currentTime = newTime;
        setLocalState(prev => ({ ...prev, currentTime: newTime }));
      };

      const handleTouchEnd = () => {
        setLocalState(prev => ({ ...prev, isDragging: false }));
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    };

    // Auto-start preview only for main VSL video
    useEffect(() => {
      // Only start preview for main VSL video, not testimonial videos
      if (videoId === "main-vsl") {
        const timer = setTimeout(() => {
          startPreview();
        }, 500); // Small delay to ensure video is loaded
        
        return () => clearTimeout(timer);
      }
    }, [videoId]);

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
          poster={poster || "/speaker.jpg"}
          preload={autoPreload ? "auto" : "metadata"}
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          x-webkit-airplay="allow"
          controlsList="nodownload"
          disablePictureInPicture={false}
          className="w-full h-full object-contain -z-10"
          style={{ pointerEvents: 'none' }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              console.log('Video metadata loaded for:', videoId, 'duration:', videoRef.current.duration);
              setLocalState(prev => ({ ...prev, duration: videoRef.current!.duration }));
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              const currentTime = videoRef.current.currentTime;
              setLocalState(prev => ({ ...prev, currentTime }));

              // Note: Preview time limit is now handled by timer, not onTimeUpdate
              // This prevents conflicts between timer and onTimeUpdate logic
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
            console.error('Video error for', videoId, ':', e);
            console.error('Video src:', videoSrc);
            setLocalState(prev => ({ ...prev, isPlaying: false }));
          }}
          onLoadedData={() => {
            console.log('Video loaded successfully for', videoId);
            setLocalState(prev => ({ ...prev, isLoading: false }));
          }}
          onLoadStart={() => {
            console.log('Video loading started for', videoId);
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
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <LoadingSpinner />
          </div>
        )}

        {/* Center Play Button - Visible for all videos */}
        {(!localState.isPlaying || localState.isPreview) && !localState.isLoading && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLocalPlayPause();
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-16 rounded flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer z-20"
            style={{
              backgroundColor: 'rgba(92, 28, 119, 0.9)',
              animation: 'pulse 3s ease-in-out infinite'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(92, 28, 119, 1)';
            }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(92, 28, 119, 0.9)'}
          >
            <PlayIcon className="w-8 h-8 text-white ml-1" />
          </div>
        )}

        {/* Controls Container - Visible for all videos */}
        {true && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[40px] transition-all duration-300 opacity-100 z-40"
            style={{ backgroundColor: 'rgba(92, 28, 119, 0.7)' }}
          >
            <div className="flex items-center justify-between px-4 h-full relative">
              {/* Progress Bar */}
              <div 
                className={`absolute left-36 right-24 top-1/2 transform -translate-y-1/2 h-1 bg-white/20 ${isSeekingEnabled ? 'cursor-pointer hover:h-2 transition-all duration-200' : ''}`}
                onClick={handleProgressBarClick}
                onMouseDown={handleProgressBarMouseDown}
                onTouchStart={handleProgressBarTouchStart}
              >
                <div className="absolute left-0 top-0 h-full bg-white transition-all duration-100" style={{ width: `${progressPercentage}%` }} />
                
                {/* Time Display */}
                <div className="absolute -left-24 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium whitespace-nowrap">
                  {formatTime(localState.currentTime)}
                  {isSeekingEnabled && (
                    <span> / {(() => {
                      const baseId = videoId.split('-')[0];
                      const videoData = testimonialVideos.find(v => v.id === baseId);
                      return videoData?.duration || '0:00';
                    })()}</span>
                  )}
                </div>
                
                {/* Progress Indicator */}
                <div 
                  className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full transition-all duration-200 ${isSeekingEnabled ? 'hover:w-3 hover:h-3' : ''} ${localState.isDragging ? 'w-3 h-3 shadow-lg' : ''}`} 
                  style={{ left: `calc(${progressPercentage}% - ${localState.isDragging || isSeekingEnabled ? '6px' : '4px'})` }} 
                />
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
                    <PauseIcon />
                  ) : (
                    <PlayIcon />
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
                  <VolumeIcon isMuted={localState.isMuted} />
                </button>

                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (videoRef.current) {
                      // IMPORTANT: Stop preview mode before entering fullscreen
                      isPreviewActiveRef.current = false;
                      if (previewTimerRef.current) {
                        clearTimeout(previewTimerRef.current);
                        previewTimerRef.current = null;
                      }
                      setLocalState(prev => ({ ...prev, isPreview: false }));

                      // Use the toggleFullscreen utility
                      await toggleFullscreen(videoRef.current);
                    }
                  }}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  <FullscreenIcon />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  // Render video preview component (unused but kept for potential future use)
  // const renderVideoPreview = (video: typeof testimonialVideos[0], index: number) => {
  //   const colorClasses = {
  //     purple: 'bg-purple-600 hover:bg-purple-700',
  //     blue: 'bg-blue-600 hover:bg-blue-700',
  //     green: 'bg-green-600 hover:bg-green-700',
  //     pink: 'bg-pink-600 hover:bg-pink-700',
  //     orange: 'bg-orange-600 hover:bg-orange-700',
  //     teal: 'bg-teal-600 hover:bg-teal-700'
  //   };
  // 
  //   const controlBgClasses = {
  //     purple: 'bg-purple-600',
  //     blue: 'bg-blue-600',
  //     green: 'bg-green-600',
  //     pink: 'bg-pink-600',
  //     orange: 'bg-orange-600',
  //     teal: 'bg-teal-600'
  //   };
  // 
  //   const progressBgClasses = {
  //     purple: 'bg-purple-500',
  //     blue: 'bg-blue-500',
  //     green: 'bg-green-500',
  //     pink: 'bg-pink-500',
  //     orange: 'bg-orange-500',
  //     teal: 'bg-teal-500'
  //   };

  //   return (
  //     <div className="bg-white rounded-lg overflow-hidden shadow-lg">
  //       {/* Video Content */}
  //       <div className="aspect-video relative overflow-hidden">
  //         {/* Video Preview */}
  //         <video
  //           src={video.file}
  //           className="w-full h-full object-cover"
  //           muted
  //           preload="metadata"
  //           playsInline
  //         />
  //         
  //         {/* Dark Overlay */}
  //         <div className="absolute inset-0 bg-black bg-opacity-40"></div>
  //         
  //         {/* Play Button */}
  //         <div className="absolute inset-0 flex items-center justify-center">
  //           <div 
  //             className={`w-20 h-20 ${colorClasses[video.color as keyof typeof colorClasses]} rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer`}
  //             onClick={() => openVideoModal(video.file)}
  //           >
  //             <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
  //               <path d="M8 5v10l7-5z"/>
  //             </svg>
  //           </div>
  //         </div>
  //         
  //       </div>
  //       
  //       {/* Video Controls */}
  //       <div className={`${controlBgClasses[video.color as keyof typeof controlBgClasses]} px-4 py-2 flex items-center justify-between text-white text-sm`}>
  //         <div className="flex items-center space-x-3">
  //           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
  //             <path d="M8 5v10l7-5z"/>
  //           </svg>
  //           <span>{video.duration}</span>
  //         </div>
  //         <div className="flex-1 mx-4">
  //           <div className={`${progressBgClasses[video.color as keyof typeof progressBgClasses]} h-1 rounded-full`}>
  //             <div className="bg-white h-1 rounded-full w-1/4"></div>
  //           </div>
  //         </div>
  //         <div className="flex items-center space-x-2">
  //           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
  //             <path d="M3 4h2v12H3V4zm4 0h2v12H7V4zm4 0h2v12h-2V4zm4 0h2v12h-2V4z"/>
  //           </svg>
  //           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
  //             <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
  //           </svg>
  //           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
  //             <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z"/>
  //           </svg>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  useEffect(() => {
    // Track page visit only once
    const trackVisit = async () => {
      try {
        await supabase
          .from('funnel_analytics')
          .insert({
            page_visited: 'confirmed',
            timestamp: new Date().toISOString()
          });
      } catch (error) {
        console.log('Analytics tracking failed:', error);
      }
    };
    trackVisit();
  }, [supabase]);

  useEffect(() => {
    // Get appointment date from URL params
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        setAppointmentDate(parseISO(dateParam));
      } catch (error) {
        console.log('Date parsing failed:', error);
      }
    }
  }, [searchParams]);

  // Handle Escape key to close video modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVideoModalOpen) {
        closeVideoModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVideoModalOpen]);

  const handleCheckout = () => {
    router.push('/funnel/checkout');
  };


  // Sample video data - replace with actual content (unused but kept for reference)
  // const videoSections = [
  //   {
  //     title: "What Is FunnelMaster Training System",
  //     duration: "5:42",
  //     thumbnail: "/placeholder-video.jpg"
  //   },
  //   {
  //     title: "Step 1: Market Research Framework",
  //     duration: "8:15",
  //     thumbnail: "/placeholder-video.jpg"
  //   },
  //   {
  //     title: "Step 2: Content Creation System",
  //     duration: "12:30",
  //     thumbnail: "/placeholder-video.jpg"
  //   },
  //   {
  //     title: "Step 3: Lead Generation Automation",
  //     duration: "9:45",
  //     thumbnail: "/placeholder-video.jpg"
  //   },
  //   {
  //     title: "Step 4: Sales Process Optimization",
  //     duration: "15:20",
  //     thumbnail: "/placeholder-video.jpg"
  //   },
  //   {
  //     title: "Step 5: Client Fulfillment System",
  //     duration: "11:10",
  //     thumbnail: "/placeholder-video.jpg"
  //   }
  // ];

  return (
    <>
      {/* Load Wistia Scripts */}
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script src="https://fast.wistia.com/embed/09txw2012g.js" type="module" strategy="afterInteractive" />
      <Script src="https://fast.wistia.com/embed/v6p9r70tof.js" type="module" strategy="afterInteractive" />

      <div className="min-h-screen bg-white">
        {/* Header with Logo and Warning */}
        <div className="mt-4 md:mt-0 pt-0 md:pt-6 px-4 md:px-8 text-center">
          <div className="flex justify-center pb-12 md:pb-0">
            <img src="/image.png" alt="Logo" width={180} height={45} />
          </div>
          <p className="text-base md:text-3xl font-extrabold md:font-black -mt-8 md:mt-0" style={{color: 'rgb(223, 17, 17)'}}>Wait! Your booking is not yet complete!</p>
          <div className="w-full h-px bg-gray-300 mt-2 md:mt-4 mb-2 md:mb-4"></div>
        </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 text-center">
        {/* Step Headline */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-1 md:mb-4">
            Step #1 Of 2: Watch The Video Below
          </h1>
          <p className="text-xs md:text-2xl text-black md:tracking-normal -mt-1 md:mt-0" style={{letterSpacing: '-1px'}}>
            <span className="md:tracking-normal md:letter-spacing-normal">Please Watch The Video Below To <span className="underline">Confirm Your Consultation</span></span>
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-12">
          {/* Video Container */}
          <div className="max-w-4xl mx-auto mb-4">
            <div className="overflow-hidden">
              <div className="rounded-2xl md:border-8 md:border-gray-900 overflow-hidden">
                <CustomVideoPlayer
                  videoSrc="/api/video-s3?url=https%3A%2F%2Fastroforyou.s3.us-east-2.amazonaws.com%2FThank%2Byou%2BVSL.mp4"
                  videoId="main-vsl"
                  className="w-full h-full"
                  autoPreload={true}
                  poster="/video-previews/main-vsl.jpg"
                />
              </div>
            </div>
          </div>

          {/* Reservation Notice */}
          <div className="mb-4 md:mb-2">
            <p className="text-xs md:text-base font-black md:font-semibold text-gray-800">Your Call Is Reserved For The Next:</p>
          </div>

          {/* Important Notice */}
          <div className="mb-6 md:mb-12 mt-4 md:mt-8">
            <p className="text-base md:text-5xl font-black md:font-bold mb-3 md:mb-6">
              <span className="md:text-red-600" style={{color: 'rgb(223, 17, 17)'}}>IMPORTANT:</span> <span className="text-black">Add The Event To Your Calendar</span>
            </p>
            <p className="text-sm md:text-2xl font-light md:font-normal text-black mb-6 md:mb-8 max-w-4xl mx-auto px-2 md:px-0 leading-tight md:leading-normal -mt-2 md:mt-0">
              To add the event to your calendar you need to go to your email, open the email that says &quot;Invitation from an unknown sender&quot; from an <span className="underline">@annaraight.com</span> domain and click &quot;Add To Calendar&quot;
            </p>
            
            {/* Gmail Screenshot Mockup */}
            <div className="max-w-4xl mx-auto mb-6 md:mb-12">
              <div className="bg-white border border-gray-300 rounded-lg shadow-sm md:shadow-lg overflow-hidden">
                {/* Gmail Header */}
                <div className="bg-gray-50 px-2 md:px-4 py-2 md:py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs md:text-sm font-semibold">!</span>
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-medium text-gray-900">████@annaraight.com</div>
                        <div className="text-xs text-gray-600">to me ▼</div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                      <span>2:56 PM (0 minutes ago)</span>
                      <div className="flex space-x-1">
                        <button className="p-1">⭐</button>
                        <button className="p-1">😊</button>
                        <button className="p-1">↩</button>
                        <button className="p-1">⋮</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 md:hidden">2:56 PM</div>
                  </div>
                </div>
                
                {/* Email Content */}
                <div className="p-3 md:p-6 bg-gray-100">
                  <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
                    <p className="text-xs md:text-sm text-gray-700 mb-3 md:mb-4">
                      This event isn&apos;t in your calendar yet. You haven&apos;t interacted with ████@annaraight.com before.<br/>
                      Do you want to automatically add this and future invitations from them to your calendar?
                    </p>
                    <div className="text-center mb-3 md:mb-4">
                      <p className="text-red-600 text-xs md:text-sm font-semibold">Please click &quot;Add To Calendar&quot;</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                      <div className="relative">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg font-medium text-sm md:text-base">
                          Add to calendar
                        </button>
                        {/* Red circle highlight */}
                        <div className="absolute -inset-2 border-2 md:border-4 border-red-500 rounded-full animate-pulse"></div>
                      </div>
                      <button className="text-gray-600 hover:text-gray-800 px-4 py-2 text-sm md:text-base">
                        Report spam
                      </button>
                      <div className="hidden md:block ml-auto">
                        <button className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs">?</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Step 2 Section */}
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 md:mb-6">
                Step #2 Of 2: Watch reviews from our clients
              </h2>
            </div>
          </div>
        </div>

        {/* Client Results Videos */}
        <div className="mb-16">
          {/* Video Testimonials */}
          <div className="grid grid-cols-1 gap-12 mb-12">
            {testimonialVideos.map((video) => (
              <TestimonialCard
                key={video.id}
                name={video.name}
                quote={video.quote}
                videoId={video.id}
                videoSrc={video.file}
                poster={video.poster}
                avatarLetter={video.avatarLetter}
                wistiaMediaId={video.wistiaMediaId}
                CustomVideoPlayer={CustomVideoPlayer}
                WistiaVideoPlayer={WistiaVideoPlayer}
              />
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            What to Expect on Your Call
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Your Astrology Goals</h4>
              <p className="text-gray-600 text-sm">
                We&apos;ll talk about your experience and what you want to achieve with astrology.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Personalized Path</h4>
              <p className="text-gray-600 text-sm">
                You&apos;ll see how our course can help you reach those goals step by step.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Next Steps</h4>
              <p className="text-gray-600 text-sm">
                We&apos;ll outline how to get started and begin your astrology journey.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 py-12">
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

      {/* Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeVideoModal}>
          <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={closeVideoModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold z-10"
            >
              ✕ Close
            </button>
            
            {/* Video Player */}
            <div className="rounded-lg overflow-hidden">
              <CustomVideoPlayer
                videoSrc={selectedVideo || ''}
                startTime={0}
                videoId="modal-video"
                className="w-full h-full"
                poster=""
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic';
// Version number - increment this when you make changes
const PAGE_VERSION = '2.0.0';

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>}>
      <ConfirmedPageContent />
    </Suspense>
  );
}