'use client';

import { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  videoSrc?: string;
  posterSrc?: string;
  vimeoId?: string;
  youtubeId?: string;
  wistiaId?: string;
  className?: string;
}

export default function VideoPlayer({ 
  videoSrc, 
  posterSrc = "/speaker.jpg", 
  vimeoId, 
  youtubeId, 
  wistiaId,
  className = "" 
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Блокировка клавиш (кроме пробела для паузы)
  useEffect(() => {
    if (vimeoId || youtubeId || wistiaId) {
      // Don't add event listener for iframe videos
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        37,  // Левая стрелка
        39,  // Правая стрелка
        38,  // Верхняя стрелка
        40,  // Нижняя стрелка
        74,  // J
        75,  // K
        76,  // L
        48, 49, 50, 51, 52, 53, 54, 55, 56, 57 // Цифры 0-9
      ];
      
      // Разрешаем пробел (32) для паузы/воспроизведения
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

  // Блокировка промотки видео
  const handleSeeking = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    // Возвращаем к текущему времени воспроизведения
    video.currentTime = video.currentTime;
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 2000);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    // Сохраняем текущее время как "разрешенное"
    video.dataset.allowedTime = video.currentTime.toString();
  };

  const handleSeekAttempt = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const allowedTime = parseFloat(video.dataset.allowedTime || '0');
    
    // Если пользователь пытается перейти вперед
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
        onSeeking={handleSeeking}
        onTimeUpdate={handleTimeUpdate}
        onSeeked={handleSeekAttempt}
        onKeyDown={(e) => {
          const blockedKeys = [37, 39, 38, 40, 74, 75, 76, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
          if (blockedKeys.includes(e.keyCode)) {
            e.preventDefault();
            e.stopPropagation();
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 2000);
            return false;
          }
        }}
        style={{ display: error ? 'none' : 'block' }}
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        disablePictureInPicture
      >
        <source src={videoSrc || "/api/video-stream"} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Предупреждение о блокировке */}
      {showWarning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg text-center">
          <div className="text-lg font-semibold mb-1">⚠️ Video Locked</div>
          <div className="text-sm opacity-90">Please watch without skipping</div>
        </div>
      )}

      {/* Overlay для блокировки клика по полосе прогресса */}
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