'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface LockedVideoPlayerProps {
  youtubeId: string;
  title?: string;
  duration?: string;
  posterSrc?: string;
  className?: string;
}

export default function LockedVideoPlayer({ 
  youtubeId, 
  title = "Professional Training",
  duration = "45 min",
  posterSrc = "/speaker.jpg", 
  className = "" 
}: LockedVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePlay = () => {
    // МГНОВЕННО показываем overlay ДО всего остального
    setShowLoadingOverlay(true);
    
    // Увеличиваем задержку загрузки iframe для гарантированного скрытия
    setTimeout(() => {
      setIsPlaying(true);
    }, 200);
    
    // Увеличиваем время загрузки до 6 секунд для полного скрытия YouTube
    setTimeout(() => {
      setIsVideoLoaded(true);
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 1000);
    }, 6000);
  };

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (playerRef.current?.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Отслеживание изменений полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Блокировка всех попыток взаимодействия
  useEffect(() => {
    if (isPlaying) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Блокируем все клавиши управления видео, КРОМЕ F (полный экран)
        const blockedKeys = [32, 37, 39, 38, 40, 77, 75, 74, 76]; // Убрали 70 (F)
        const numberKeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
        
        // Разрешаем F для полноэкранного режима
        if (e.keyCode === 70 || e.which === 70) {
          toggleFullscreen();
          return;
        }
        
        if (blockedKeys.includes(e.keyCode) || numberKeys.includes(e.keyCode)) {
          e.preventDefault();
          e.stopPropagation();
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 2000);
          return false;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPlaying, toggleFullscreen]);

  // Автоскрытие контролов через 3 секунды
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  if (isPlaying) {
    return (
      <div 
        ref={playerRef} 
        className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : `aspect-video ${className}`}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onMouseMove={() => setShowControls(true)}
      >
        {/* YouTube плеер без контролов - РЕНДЕРИТСЯ ТОЛЬКО ПОСЛЕ ЗАДЕРЖКИ */}
        {!showLoadingOverlay && (
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={`/api/video-proxy?v=${youtubeId}&autoplay=1`}
            title={title}
            frameBorder="0"
            allowFullScreen={true}
            className="absolute inset-0 w-full h-full rounded-lg"
            style={{ 
              pointerEvents: 'none', // Полная блокировка взаимодействий
              transform: isFullscreen ? 'scale(1)' : 'scale(1.15)', // Увеличиваем масштаб для обрезки YouTube элементов
              transformOrigin: 'center center',
              borderRadius: isFullscreen ? '0' : '8px'
            }}
          />
        )}
        
        {/* Полная блокировка взаимодействий */}
        <div 
          className="absolute inset-0 z-50 bg-transparent cursor-default"
          onClick={(e) => {
            e.preventDefault();
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 2000);
          }}
          onMouseDown={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
        
        
        {/* ЗАГРУЗОЧНЫЙ OVERLAY - МАКСИМАЛЬНОЕ СКРЫТИЕ YOUTUBE */}
        {showLoadingOverlay && (
          <div 
            className="absolute inset-0 bg-black flex flex-col items-center justify-center"
            style={{ 
              zIndex: 10000,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#000000'
            }}
          >
            {/* Дополнительный черный фон для гарантии */}
            <div className="absolute inset-0 bg-black" style={{ zIndex: -1 }}></div>
            
            {/* Анимированный логотип */}
            <div className="relative mb-8">
              <div className="w-28 h-28 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Загрузочный текст */}
            <div className="text-white text-center max-w-md">
              <div className="text-3xl font-bold mb-3">Starting Exclusive Training</div>
              <div className="text-xl opacity-90 mb-6">Preparing your premium content...</div>
              
              {/* Улучшенный прогресс-бар */}
              <div className="w-96 bg-gray-800 rounded-full h-3 mb-6 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all ease-out shadow-lg"
                  style={{ 
                    width: isVideoLoaded ? '100%' : '8%',
                    transition: 'width 5.5s ease-out',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)'
                  }}
                />
              </div>
              
              <div className="text-base opacity-70 font-medium">
                {!isVideoLoaded ? 'Initializing secure video player...' : 'Content ready • Starting now'}
              </div>
            </div>
            
            {/* Премиум брендинг */}
            <div className="absolute top-8 left-8">
              <div className="bg-black bg-opacity-60 backdrop-blur-md rounded-xl px-6 py-3 border border-white border-opacity-30">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-white text-lg font-bold tracking-wide">PREMIUM TRAINING</span>
                </div>
              </div>
            </div>
            
            {/* Дополнительная информация */}
            <div className="absolute bottom-8 text-center text-white text-sm opacity-60">
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Secure Connection • HD Quality • No Interruptions</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Уведомление о блокировке */}
        {showWarning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-70 bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg text-center">
            <div className="text-lg font-semibold mb-1">⚠️ Video Locked</div>
            <div className="text-sm opacity-90">Please watch without skipping</div>
          </div>
        )}
        
        {/* Информационная панель */}
        <div className="absolute top-4 left-4 z-60 bg-black bg-opacity-70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">LIVE • {title}</span>
          </div>
        </div>
        
        {/* Прогресс бар и контролы - показываются только при наведении */}
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 z-60 transition-opacity duration-300">
            <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center justify-between text-white text-sm mb-2">
                <span>Live Training in Progress</span>
                <div className="flex items-center space-x-3">
                  <span>{duration}</span>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                  >
                    {isFullscreen ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                  style={{ width: '25%' }} // Можно анимировать
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`aspect-video relative ${className}`}>
      {/* Превью с предупреждением */}
      <div 
        className="absolute inset-0 cursor-pointer group overflow-hidden rounded-lg"
        onClick={handlePlay}
      >
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={posterSrc} 
            alt="Video Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>
        
        {/* Центральная кнопка */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping scale-125"></div>
            <div className="relative w-24 h-24 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="text-center px-6 max-w-lg">
            <h3 className="text-2xl font-bold mb-3 drop-shadow-lg">{title}</h3>
            <p className="text-lg opacity-90 mb-4">{duration} • Exclusive Content</p>
          </div>
        </div>
        
        {/* Предупреждение о блокировке */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-yellow-600 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-start space-x-3">
              <div className="text-xl">⚠️</div>
              <div>
                <div className="font-semibold mb-1">Important Notice</div>
                <div className="text-sm opacity-90">
                  This video cannot be skipped or fast-forwarded. Please watch the complete training for best results.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}