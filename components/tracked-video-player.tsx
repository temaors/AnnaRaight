'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface TrackedVideoPlayerProps {
  videoSrc?: string;
  posterSrc?: string;
  vimeoId?: string;
  youtubeId?: string;
  wistiaId?: string;
  className?: string;
  videoPage: string; // Identifier for analytics
}

function TrackedVideoPlayerContent({ 
  videoSrc, 
  posterSrc = "/speaker.jpg", 
  vimeoId, 
  youtubeId, 
  wistiaId,
  className = "",
  videoPage
}: TrackedVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  
  // Tracking state
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);
  
  // Get email from URL params
  const email = searchParams.get('email');
  const sessionId = useRef(`session-${Date.now()}`).current;

  // Track video view
  const trackVideoView = useCallback(async (isCompleted = false) => {
    try {
      const viewPercentage = videoDuration > 0 ? (totalWatchTime / videoDuration) * 100 : 0;
      
      console.log('Tracking video view:', {
        videoPage,
        email,
        totalWatchTime,
        viewPercentage,
        isCompleted
      });
      
      await fetch('/api/video-view/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_page: videoPage,
          email: email,
          view_duration: Math.round(totalWatchTime),
          view_percentage: Math.round(viewPercentage),
          is_completed: isCompleted,
          session_id: sessionId
        }),
      });
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  }, [videoPage, email, totalWatchTime, videoDuration, sessionId]);

  // Update watch time
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const now = Date.now();
        const timeDiff = (now - lastUpdateTime) / 1000; // Convert to seconds
        setTotalWatchTime(prev => prev + timeDiff);
        setLastUpdateTime(now);
      }, 1000); // Update every second

      return () => clearInterval(interval);
    } else {
      setLastUpdateTime(Date.now());
    }
  }, [isPlaying, lastUpdateTime]);

  // Send tracking data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalWatchTime > 30) { // Only track if watched more than 30 seconds
        trackVideoView();
      }
    }, 30000); // Send every 30 seconds

    return () => clearInterval(interval);
  }, [totalWatchTime, videoDuration, trackVideoView]);

  // Send final tracking on unmount
  useEffect(() => {
    return () => {
      if (totalWatchTime > 0) {
        trackVideoView();
      }
    };
  }, [totalWatchTime, trackVideoView]);

  // Handle video events
  const handlePlay = () => {
    setIsPlaying(true);
    setLastUpdateTime(Date.now());
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setVideoDuration(video.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (!hasTrackedCompletion) {
      trackVideoView(true); // Mark as completed
      setHasTrackedCompletion(true);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    video.dataset.allowedTime = video.currentTime.toString();
    
    // Check if video is near end (95% complete)
    if (video.duration > 0 && video.currentTime / video.duration > 0.95 && !hasTrackedCompletion) {
      trackVideoView(true);
      setHasTrackedCompletion(true);
    }
  };

  // For iframe players, we can't track as accurately
  useEffect(() => {
    if (vimeoId || youtubeId || wistiaId) {
      // Track page visit for iframe videos
      trackVideoView();
    }
  }, [vimeoId, youtubeId, wistiaId, trackVideoView]);

  // Key blocking for non-iframe videos only
  useEffect(() => {
    if (vimeoId || youtubeId || wistiaId) {
      // Don't add event listener for iframe videos
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        37, 39, 38, 40, 74, 75, 76,
        48, 49, 50, 51, 52, 53, 54, 55, 56, 57
      ];
      
      if (blockedKeys.includes(e.keyCode) || blockedKeys.includes(e.which)) {
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [vimeoId, youtubeId, wistiaId]);

  // Vimeo Player
  if (vimeoId) {
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?h=0&badge=0&autopause=0&player_id=0&app_id=58479`}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Training Video"
        />
      </div>
    );
  }

  // YouTube Player  
  if (youtubeId) {
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=1&controls=1&hd=1`}
          title="Professional Astrology Training"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ borderRadius: '8px' }}
        />
      </div>
    );
  }

  // Wistia Player
  if (wistiaId) {
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          src={`https://fast.wistia.net/embed/iframe/${wistiaId}`}
          title="Training Video"
          allow="autoplay; fullscreen"
          allowTransparency
          frameBorder="0"
          scrolling="no"
          className="w-full h-full"
          name="wistia_embed"
          allowFullScreen
        />
      </div>
    );
  }

  // Local/Self-hosted Video Player
  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load video. Please try refreshing the page.');
  };

  const handleSeeking = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    video.currentTime = video.currentTime;
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 2000);
  };

  const handleSeekAttempt = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const allowedTime = parseFloat(video.dataset.allowedTime || '0');
    
    if (video.currentTime > allowedTime + 1) {
      video.currentTime = allowedTime;
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2000);
    }
  };

  return (
    <div className={`aspect-video relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading video...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      )}

      <video 
        ref={videoRef}
        className="w-full h-full"
        poster={posterSrc}
        controls
        preload="metadata"
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onSeeking={handleSeeking}
        onTimeUpdate={handleTimeUpdate}
        onSeeked={handleSeekAttempt}
        style={{ display: error ? 'none' : 'block' }}
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        disablePictureInPicture
      >
        <source src={videoSrc || "/api/video-stream"} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {showWarning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg text-center">
          <div className="text-lg font-semibold mb-1">⚠️ Video Locked</div>
          <div className="text-sm opacity-90">Please watch without skipping</div>
        </div>
      )}

      <div 
        className="absolute bottom-0 left-0 right-0 h-12 z-40 bg-transparent"
        onClick={(e) => {
          e.preventDefault();
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 2000);
        }}
      />
    </div>
  );
}

export default function TrackedVideoPlayer(props: TrackedVideoPlayerProps) {
  return (
    <Suspense fallback={
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    }>
      <TrackedVideoPlayerContent {...props} />
    </Suspense>
  );
}