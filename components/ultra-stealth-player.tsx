'use client';

import { useState, useRef, useEffect } from 'react';

interface UltraStealthPlayerProps {
  youtubeId: string;
  title?: string;
  duration?: string;
  posterSrc?: string;
  className?: string;
}

export default function UltraStealthPlayer({ 
  youtubeId, 
  title = "Professional Training",
  duration = "45 min",
  posterSrc = "/speaker.jpg", 
  className = "" 
}: UltraStealthPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePlay = () => {
    setShowLoadingOverlay(true);
    setIsPlaying(true);
    
    // Скрываем YouTube на старте, показываем через 3 секунды
    setTimeout(() => {
      setIsVideoLoaded(true);
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 500);
    }, 3000);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (playerRef.current?.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Скрытие контролов через некоторое время
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, showControls]);

  if (isPlaying) {
    return (
      <div 
        ref={playerRef}
        className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : `aspect-video ${className}`}`}
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Основной YouTube iframe скрыт за черными блоками */}
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={`/api/video-proxy?v=${youtubeId}&autoplay=1`}
            title={title}
            frameBorder="0"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ 
              transform: 'scale(1.1)', // Немного увеличиваем чтобы обрезать края
              transformOrigin: 'center center'
            }}
          />
          
          {/* Черные полосы для скрытия YouTube элементов */}
          <div className="absolute inset-x-0 top-0 h-12 bg-black z-20 pointer-events-none"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-y-0 left-0 w-4 bg-black z-20 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-4 bg-black z-20 pointer-events-none"></div>
          
          {/* Блокировка YouTube логотипа в правом нижнем углу */}
          <div className="absolute bottom-3 right-3 w-24 h-8 bg-black z-30 pointer-events-none rounded"></div>
          
          {/* Наши кастомные контролы */}
          {showControls && (
            <div className="absolute bottom-4 left-4 right-4 z-40 transition-opacity duration-300">
              <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">LIVE TRAINING</span>
                    </div>
                    <span className="text-sm opacity-75">•</span>
                    <span className="text-sm opacity-75">{title}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm opacity-75">{duration}</span>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Водяной знак нашего бренда */}
          <div className="absolute top-4 left-4 z-30 pointer-events-none">
            <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-sm font-semibold">🔒 EXCLUSIVE</span>
            </div>
          </div>
          
          {/* ЗАГРУЗОЧНЫЙ OVERLAY - СКРЫВАЕТ YOUTUBE НА СТАРТЕ */}
          {showLoadingOverlay && (
            <div className="absolute inset-0 z-80 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
              {/* Элегантный спиннер */}
              <div className="relative mb-12">
                <div className="w-32 h-32 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-white border-opacity-20 animate-ping scale-125"></div>
              </div>
              
              {/* Премиум загрузочный текст */}
              <div className="text-white text-center max-w-lg">
                <div className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Preparing Exclusive Content
                </div>
                <div className="text-xl opacity-90 mb-8 font-light">
                  Loading your premium training experience...
                </div>
                
                {/* Элегантный прогресс-бар */}
                <div className="w-96 bg-gray-700 rounded-full h-1 mb-6 overflow-hidden">
                  <div 
                    className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-3000 ease-out shadow-lg"
                    style={{ 
                      width: isVideoLoaded ? '100%' : '15%',
                      transition: 'width 3s ease-out',
                      boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                    }}
                  />
                </div>
                
                <div className="text-sm opacity-70 font-medium tracking-wide">
                  {!isVideoLoaded ? 'Initializing premium player...' : 'Content ready • Starting now'}
                </div>
              </div>
              
              {/* Премиум брендинг */}
              <div className="absolute top-8 left-8">
                <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl px-6 py-3 border border-white border-opacity-20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-white text-lg font-bold tracking-wide">PREMIUM TRAINING</span>
                  </div>
                </div>
              </div>
              
              {/* Дополнительные элементы */}
              <div className="absolute bottom-8 right-8 text-white text-sm opacity-60">
                <div className="text-right">
                  <div className="font-semibold">{title}</div>
                  <div className="text-xs mt-1">Exclusive Access • {duration}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-video relative ${className}`}>
      {/* Профессиональная превью */}
      <div 
        className="absolute inset-0 cursor-pointer group overflow-hidden rounded-lg"
        onClick={handlePlay}
      >
        {/* Background с эффектами */}
        <div className="absolute inset-0">
          <img 
            src={posterSrc} 
            alt="Video Preview"
            className="w-full h-full object-cover"
          />
          {/* Градиентные overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20" />
        </div>
        
        {/* Центральная кнопка воспроизведения */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="relative mb-8">
            {/* Пульсирующие кольца */}
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping scale-150"></div>
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping scale-125 animation-delay-300"></div>
            
            {/* Основная кнопка */}
            <div className="relative w-28 h-28 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Информация о видео */}
          <div className="text-center px-6 max-w-lg">
            <h3 className="text-3xl font-bold mb-3 drop-shadow-lg leading-tight">{title}</h3>
            <div className="flex items-center justify-center space-x-6 text-base opacity-90 mb-4">
              <span className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                4K Quality
              </span>
              <span className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">{duration}</span>
            </div>
            <p className="text-lg opacity-80 leading-relaxed">
              Exclusive masterclass revealing professional techniques
            </p>
          </div>
        </div>
        
        {/* Верхняя панель с брендингом */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            🔴 LIVE
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
            🎯 PREMIUM CONTENT
          </div>
        </div>
        
        {/* Нижняя информационная панель */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">A</span>
                </div>
                <div>
                  <div className="font-semibold">Anna Raight</div>
                  <div className="text-xs opacity-75">Master Astrologer</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-75">Training starts in</div>
                <div className="font-semibold">3:47</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}