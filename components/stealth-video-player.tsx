'use client';

import { useState, useRef } from 'react';

interface StealthVideoPlayerProps {
  youtubeId: string;
  title?: string;
  duration?: string;
  posterSrc?: string;
  className?: string;
}

export default function StealthVideoPlayer({ 
  youtubeId, 
  title = "Professional Astrology Training",
  duration = "45 min",
  posterSrc = "/speaker.jpg", 
  className = "" 
}: StealthVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePlay = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsPlaying(true);
      setIsLoading(false);
    }, 500);
  };

  if (isPlaying) {
    return (
      <div className={`aspect-video relative ${className}`}>
        {/* Полностью скрытый YouTube плеер через прокси */}
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={`/api/video-proxy?v=${youtubeId}&autoplay=1`}
          title={title}
          frameBorder="0"
          allowFullScreen
          className="rounded-lg stealth-youtube"
          style={{ 
            border: 'none',
            borderRadius: '8px'
          }}
        />
        
        {/* Дополнительные overlay для скрытия YouTube элементов */}
        <div className="absolute bottom-2 right-2 w-20 h-6 bg-black opacity-80 rounded pointer-events-none z-10"></div>
      </div>
    );
  }

  return (
    <div className={`aspect-video relative ${className}`}>
      {/* Кастомный дизайн плеера */}
      <div 
        className="absolute inset-0 cursor-pointer group overflow-hidden rounded-lg"
        onClick={handlePlay}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <img 
            src={posterSrc} 
            alt="Video Preview"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        
        {/* Custom Play Interface */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          {/* Play Button */}
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            
            {/* Pulsing Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
          </div>
          
          {/* Video Info */}
          <div className="text-center px-4">
            <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{title}</h3>
            <div className="flex items-center justify-center space-x-4 text-sm opacity-90">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                HD Quality
              </span>
              <span>•</span>
              <span>{duration}</span>
            </div>
          </div>
        </div>
        
        {/* Top Brand Bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-medium">
            🔒 EXCLUSIVE TRAINING
          </div>
          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            LIVE
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Starting video...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}