'use client';

import { useState, useRef, useEffect } from 'react';

interface PurpleVideoPlayerProps {
  videoSrc: string;
  posterSrc?: string;
  className?: string;
  startTime?: number;
}

export function PurpleVideoPlayer({ 
  videoSrc, 
  posterSrc = "/speaker.jpg", 
  className = "",
  startTime = 0
}: PurpleVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime - startTime;
      const total = videoRef.current.duration - startTime;
      setCurrentTime(Math.max(0, current));
      setProgress(total > 0 ? Math.max(0, current) / total : 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration - startTime);
      // Set start time if provided
      if (startTime > 0) {
        videoRef.current.currentTime = startTime;
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickRatio = clickX / width;
      const newTime = clickRatio * duration + startTime;
      videoRef.current.currentTime = newTime;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('play', () => setIsPlaying(true));
      video.addEventListener('pause', () => setIsPlaying(false));

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('play', () => setIsPlaying(true));
        video.removeEventListener('pause', () => setIsPlaying(false));
      };
    }
  }, [startTime, duration]);

  return (
    <div className={`relative ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        className="w-full h-full object-cover"
        preload="metadata"
        playsInline
        style={{ display: 'block' }}
      />
      
      {/* Play Button Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-20"
          onClick={handlePlayPause}
        >
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5v10l7-5z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white">
        <div className="px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <button onClick={handlePlayPause} className="hover:text-purple-200">
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5v10l7-5z"/>
                </svg>
              )}
            </button>
            <span>{formatTime(currentTime)}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 mx-4">
            <div 
              className="bg-purple-500 h-1 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="bg-white h-1 rounded-full transition-all duration-100"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4v12l5-5v5l5-5v5l5-5V4L13 9V4L8 9V4z"/>
            </svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurpleVideoPlayer;