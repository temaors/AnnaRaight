import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('v');
    const autoplay = searchParams.get('autoplay') || '0';
    
    if (!videoId) {
      return new NextResponse('Video ID required', { status: 400 });
    }

    // Максимальные параметры для блокировки промотки и рекомендаций
    const youtubeParams = new URLSearchParams({
      autoplay,
      rel: '0',                    // Убирает похожие видео
      modestbranding: '1',         // Минимизирует YouTube брендинг
      showinfo: '0',               // Скрывает информацию о видео
      fs: '1',                     // РАЗРЕШАЕТ полноэкранный режим
      cc_load_policy: '0',         // Отключает субтитры
      iv_load_policy: '3',         // Отключает аннотации
      autohide: '1',               // Автоскрытие контролов
      controls: '0',               // ОТКЛЮЧАЕТ ВСЕ КОНТРОЛЫ (промотку, паузу и т.д.)
      hd: '1',                     // HD качество
      color: 'white',
      theme: 'dark',
      playsinline: '1',
      disablekb: '1',              // Отключает клавиатуру
      enablejsapi: '1',
      loop: '1',                   // Зацикливание видео
      playlist: videoId,           // Для зацикливания нужен playlist
      end: '9999',                 // Время окончания (большое число)
      start: '0',                  // Начало с 0 секунды
      widget_referrer: request.headers.get('origin') || 'https://annaraight.com',
      origin: request.headers.get('origin') || 'https://annaraight.com'
    });

    const youtubeUrl = `https://www.youtube.com/embed/${videoId}?${youtubeParams.toString()}`;
    
    // HTML с максимальным скрытием YouTube элементов
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Training Video</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            background: #000; 
            overflow: hidden; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        #player-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: #000;
        }
        
        #player { 
            width: 100%; 
            height: 100%; 
            border: none;
            background: #000;
        }
        
        
        .custom-controls-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: linear-gradient(transparent, rgba(0,0,0,0.1));
            pointer-events: none;
            z-index: 999;
        }
        
        .loading { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            color: white;
            font-size: 16px;
            z-index: 1001;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Дополнительное скрытие через CSS */
        iframe {
            filter: none;
        }
        
        
        /* БЛОКИРОВКА ВСЕХ ИНТЕРАКТИВНЫХ ЭЛЕМЕНТОВ */
        .interaction-blocker {
            position: absolute;
            inset: 0;
            z-index: 1000;
            pointer-events: auto;
            background: transparent;
        }
        
        /* Блокировка области промотки */
        .seek-blocker {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            z-index: 1002;
            pointer-events: auto;
            background: transparent;
        }
        
        /* Блокировка паузы по клику */
        .pause-blocker {
            position: absolute;
            inset: 0;
            z-index: 999;
            pointer-events: auto;
            background: transparent;
        }
    </style>
</head>
<body>
    <div id="player-container">
        <div class="loading" id="loading">
            <div class="loading-spinner"></div>
            <div>Loading video...</div>
        </div>
        
        <iframe 
            id="player"
            src="${youtubeUrl}" 
            frameborder="0" 
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            loading="lazy"
            onload="hideLoading()"
        ></iframe>
        
        <!-- Overlay для скрытия YouTube элементов -->
        <div class="custom-controls-overlay"></div>
        
        <!-- БЛОКИРОВЩИКИ ВЗАИМОДЕЙСТВИЯ -->
        <!-- Блокировка промотки в нижней части -->
        <div class="seek-blocker" onclick="return false;" onmousedown="return false;"></div>
        
        <!-- Блокировка паузы по клику в центре -->
        <div class="pause-blocker" onclick="return false;" onmousedown="return false;"></div>
        
        <!-- Полная блокировка взаимодействия (если нужно) -->
        <!-- <div class="interaction-blocker" onclick="return false;" onmousedown="return false;"></div> -->
    </div>

    <script>
        function hideLoading() {
            const loading = document.getElementById('loading');
            if (loading) {
                setTimeout(() => {
                    loading.style.display = 'none';
                }, 1000);
            }
        }
        
        // Дополнительная обработка для скрытия элементов
        window.addEventListener('load', function() {
            setTimeout(() => {
                // Попытка скрыть YouTube элементы через DOM
                try {
                    const iframe = document.getElementById('player');
                    if (iframe && iframe.contentWindow) {
                        // Попытка получить доступ к YouTube плееру (может не работать из-за CORS)
                        const player = iframe.contentWindow;
                    }
                } catch (e) {
                    // Игнорируем CORS ошибки
                }
            }, 2000);
        });
        
        // ПОЛНАЯ БЛОКИРОВКА ВЗАИМОДЕЙСТВИЙ
        
        // Предотвращение правого клика
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        // Предотвращение выделения
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });
        
        // Блокировка клавиш (пробел, стрелки и т.д.)
        document.addEventListener('keydown', function(e) {
            // Блокируем клавиши управления видео
            const blockedKeys = [
                32,  // Пробел (пауза/воспроизведение)
                37,  // Левая стрелка (перемотка назад)
                39,  // Правая стрелка (перемотка вперед)
                38,  // Верхняя стрелка (громкость +)
                40,  // Нижняя стрелка (громкость -)
                77,  // M (отключение звука)
                70,  // F (полноэкранный режим)
                75,  // K (пауза/воспроизведение)
                74,  // J (перемотка назад 10 сек)
                76,  // L (перемотка вперед 10 сек)
                48, 49, 50, 51, 52, 53, 54, 55, 56, 57 // Цифры 0-9 (переход по времени)
            ];
            
            if (blockedKeys.includes(e.keyCode) || blockedKeys.includes(e.which)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
        
        // Блокировка мыши на iframe
        const iframe = document.getElementById('player');
        if (iframe) {
            iframe.addEventListener('mousedown', function(e) {
                e.preventDefault();
                return false;
            });
            
            iframe.addEventListener('click', function(e) {
                e.preventDefault();
                return false;
            });
        }
        
        // Дополнительная блокировка через CSS pointer-events
        setTimeout(() => {
            const blockers = document.querySelectorAll('.seek-blocker, .pause-blocker');
            blockers.forEach(blocker => {
                blocker.style.pointerEvents = 'auto';
                blocker.style.cursor = 'default';
                
                blocker.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                
                blocker.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
            });
        }, 1000);
    </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'public, max-age=3600',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
    });
    
  } catch (error) {
    console.error('Error in video proxy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}