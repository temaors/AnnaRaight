'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Maximize2, Minimize2 } from 'lucide-react';

interface CloudFrontVideoPlayerProps {
  cloudFrontUrl: string;
  posterSrc?: string;
  className?: string;
  title?: string;
  duration?: string;
}

function CloudFrontVideoPlayerContent({ 
  cloudFrontUrl, 
  posterSrc = "/speaker.jpg", 
  className = "",
  title = "Professional Astrology Training",
  duration = "45 min"
}: CloudFrontVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Removed progressBarRef - no longer needed for non-interactive progress bar
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showCenterPlay, setShowCenterPlay] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewStarted, setPreviewStarted] = useState(false);
  
  // Video tracking state
  const totalWatchTimeRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);
  const sessionId = useRef(`session-${Date.now()}`).current;
  const email = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') : null;
  
  // Detect iOS devices
  const isIOS = useRef(false);
  useEffect(() => {
    isIOS.current = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  // Track video view
  const trackVideoView = useCallback(async (isCompleted = false) => {
    try {
      const currentVideoDuration = videoRef.current?.duration || 0;
      const viewPercentage = currentVideoDuration > 0 ? (totalWatchTimeRef.current / currentVideoDuration) * 100 : 0;
      
      console.log('Tracking video view:', {
        videoPage: 'watch',
        email,
        totalWatchTime: totalWatchTimeRef.current,
        viewPercentage,
        isCompleted
      });
      
      await fetch('/api/video-view/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_page: 'watch',
          email: email,
          view_duration: Math.round(totalWatchTimeRef.current),
          view_percentage: Math.round(viewPercentage),
          is_completed: isCompleted,
          session_id: sessionId
        }),
      });
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  }, [email, sessionId]);

  // Hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const hideControls = () => {
      if (isPlaying && !isAnimating) {
        timeout = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    hideControls();

    return () => clearTimeout(timeout);
  }, [isPlaying, showControls, isAnimating]);

  // Animation for first 5 seconds
  useEffect(() => {
    if (isPlaying && currentTime < 5) {
      setIsAnimating(true);
      setShowControls(true);
    } else {
      setIsAnimating(false);
    }
  }, [currentTime, isPlaying]);

  // Preview disabled to avoid infinite loops

  // Update watch time when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      lastUpdateTimeRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const timeDiff = (now - lastUpdateTimeRef.current) / 1000;
        totalWatchTimeRef.current += timeDiff;
        lastUpdateTimeRef.current = now;
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying]);

  // Send tracking data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalWatchTimeRef.current > 30) {
        trackVideoView();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Send final tracking on unmount
  useEffect(() => {
    return () => {
      if (totalWatchTimeRef.current > 0) {
        trackVideoView();
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Start playing immediately
        videoRef.current.muted = false;
        videoRef.current.volume = volume;
        
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          setShowCenterPlay(false);
        } catch (playError) {
          console.error('Play failed:', playError);
        }
      }
    } catch (error) {
      console.error('Error playing/pausing video:', error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const currentVideoTime = videoRef.current.currentTime;
    setCurrentTime(currentVideoTime);
    
    // Check if video is near end (95% complete)
    if (videoRef.current.duration > 0 && 
        currentVideoTime / videoRef.current.duration > 0.95 && 
        !hasTrackedCompletion) {
      trackVideoView(true);
      setHasTrackedCompletion(true);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration);
  };

  // Removed handleProgressClick - users cannot seek/scrub video

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current || !videoRef.current) return;

    if (!isFullscreen) {
      // Request fullscreen on video element directly
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes and orientation changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleOrientationChange = () => {
      // Force video resize after orientation change
      if (isFullscreen && videoRef.current) {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.style.width = '100vw';
            videoRef.current.style.height = '100vh';
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isFullscreen]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black group ${
        isFullscreen 
          ? 'fixed inset-0 z-50 flex items-center justify-center' 
          : 'rounded-2xl md:border-8 md:border-gray-900 overflow-hidden'
      } ${className}`}
      style={isFullscreen ? {
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      } : {}}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && !isAnimating && setShowControls(false)}
      onKeyDown={(e) => {
        // Prevent all keyboard shortcuts that could cause seeking
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
            e.key === 'Home' || e.key === 'End' || 
            e.key === 'PageUp' || e.key === 'PageDown' ||
            (e.key >= '0' && e.key <= '9')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      tabIndex={0}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={cloudFrontUrl}
        poster={posterSrc}
        preload="none"
        crossOrigin="anonymous"
        playsInline
        className={isFullscreen ? '' : 'w-full h-full object-cover'}
        style={isFullscreen ? {
          objectFit: 'contain',
          width: '100vw',
          height: 'auto',
          maxHeight: '85vh'
        } : {}}
        onClick={handlePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={(e) => e.preventDefault()}
        onTouchStart={(e) => {
          // Allow touch for play/pause but log for debugging
          console.log('👆 Video touch detected');
        }}
        onTouchMove={(e) => {
          // Block any touch move that might cause seeking
          e.preventDefault();
          console.log('🚫 Video touch move blocked');
        }}
        onKeyDown={(e) => {
          // Prevent all keyboard shortcuts that could cause seeking
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
              e.key === 'Home' || e.key === 'End' || 
              e.key === 'PageUp' || e.key === 'PageDown' ||
              (e.key >= '0' && e.key <= '9')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onLoadStart={() => {
          // Video loading started
        }}
        onCanPlay={() => {
          // Video can start playing
        }}
        onLoadedData={() => {
          // Video data loaded
        }}
        onLoadedMetadata={() => {
          // Video metadata loaded
        }}
        onWaiting={() => {
          // Video is waiting for data
        }}
        onPlaying={() => {
          // Video is playing
        }}
        onError={(e) => {
          console.error('Video error:', e);
        }}
      />


      {/* Center Play Button - Purple Theme with Pulsing Animation */}
      {showCenterPlay && !isPlaying && (
        <button
          onClick={handlePlayPause}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-16 rounded flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl z-30 animate-pulse hover:animate-none"
          style={{ 
            backgroundColor: 'rgba(92, 28, 119, 0.9)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(92, 28, 119, 1)';
            e.currentTarget.style.animation = 'none';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(92, 28, 119, 0.9)';
            e.currentTarget.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
          }}
        >
          <Play className="w-8 h-8 text-white ml-1" fill="white" />
        </button>
      )}

      {/* Controls Container - Purple Theme */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[40px] transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: 'rgba(92, 28, 119, 0.7)' }}
      >
        {/* Controls Row */}
        <div className="flex items-center justify-between px-4 h-full relative">
          {/* Progress Bar - Visual Only, No Interaction */}
          <div className="absolute left-24 right-24 top-1/2 transform -translate-y-1/2 h-1 bg-white/20">
            <div 
              className="absolute left-0 top-0 h-full bg-white transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Time Display - Separate from progress bar */}
          <div className="absolute left-12 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium">
            {formatTime(currentTime)}
          </div>

          {/* Left Controls */}
          <div className="flex items-center gap-4 relative z-20">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-white/80 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" fill="currentColor" />
              )}
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 relative z-20">
            {/* Volume Control */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-white/80 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-white/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CloudFrontVideoPlayer(props: CloudFrontVideoPlayerProps) {
  return <CloudFrontVideoPlayerContent {...props} />;
}