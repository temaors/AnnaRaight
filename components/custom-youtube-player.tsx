'use client';

import { useState, useRef } from 'react';

interface CustomYouTubePlayerProps {
  videoId: string;
  posterSrc?: string;
  className?: string;
}

export default function CustomYouTubePlayer({ 
  videoId, 
  posterSrc = "/speaker.jpg", 
  className = "" 
}: CustomYouTubePlayerProps) {
  const [, setIsPlaying] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);

  const handlePlay = async () => {
    setIsLoading(true);
    setIsPlaying(true);
    
    // Небольшая задержка для плавности
    setTimeout(() => {
      setShowIframe(true);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className={`aspect-video relative ${className}`}>
      {/* Custom Poster/Play Button */}
      {!showIframe && (
        <div 
          className="absolute inset-0 cursor-pointer group"
          onClick={handlePlay}
        >
          {/* Background Image */}
          <img 
            src={posterSrc} 
            alt="Video Thumbnail"
            className="w-full h-full object-cover rounded-lg"
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg" />
          
          {/* Custom Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
              <svg 
                className="w-8 h-8 text-gray-800 ml-1" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          
          {/* Custom Video Title/Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-lg font-semibold mb-1">Professional Astrology Training</h3>
            <p className="text-sm opacity-90">Exclusive masterclass • 45 min</p>
          </div>
        </div>
      )}
      
      {/* YouTube Player (Hidden until play) */}
      {showIframe && (
        <iframe
          ref={playerRef}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=1&controls=1&hd=1&color=white&theme=dark`}
          title="Training Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="rounded-lg"
          style={{ 
            borderRadius: '8px',
            filter: 'none' 
          }}
        />
      )}
    </div>
  );
}