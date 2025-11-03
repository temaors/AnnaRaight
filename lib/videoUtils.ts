// Video Player Utility Functions

/**
 * Detects if the browser is currently in fullscreen mode
 */
export const isFullscreen = (): boolean => {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).webkitCurrentFullScreenElement ||
    (document as any).msFullscreenElement ||
    (document as any).mozFullScreenElement
  );
};

/**
 * Detects if the device is iOS
 */
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Exits fullscreen mode with cross-browser support
 */
export const exitFullscreen = async (): Promise<void> => {
  const doc = document as any;
  if (doc.exitFullscreen) {
    return doc.exitFullscreen();
  } else if (doc.webkitExitFullscreen) {
    return doc.webkitExitFullscreen();
  } else if (doc.msExitFullscreen) {
    return doc.msExitFullscreen();
  } else if (doc.mozCancelFullScreen) {
    return doc.mozCancelFullScreen();
  }
};

/**
 * Enters fullscreen mode for a video element with cross-browser support
 */
export const enterFullscreen = async (element: HTMLVideoElement): Promise<void> => {
  const el = element as any;

  if (el.requestFullscreen) {
    return el.requestFullscreen().catch((err: Error) => {
      console.log('Fullscreen error:', err);
    });
  } else if (el.webkitRequestFullscreen) {
    return el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) {
    return el.msRequestFullscreen();
  } else if (el.mozRequestFullScreen) {
    return el.mozRequestFullScreen();
  }
};

/**
 * Enters fullscreen mode on iOS devices
 */
export const enterIOSFullscreen = async (video: HTMLVideoElement): Promise<void> => {
  const videoEl = video as any;

  // Ensure video is playing
  if (videoEl.paused) {
    try {
      videoEl.muted = false;
      await videoEl.play();
    } catch {
      videoEl.muted = true;
      await videoEl.play();
    }
  }

  // Try different webkit methods
  if (videoEl.webkitEnterFullscreen) {
    return videoEl.webkitEnterFullscreen();
  } else if (videoEl.webkitEnterFullScreen) {
    return videoEl.webkitEnterFullScreen();
  } else if (videoEl.webkitRequestFullscreen) {
    return videoEl.webkitRequestFullscreen();
  }
};

/**
 * Toggles fullscreen mode for a video element
 */
export const toggleFullscreen = async (video: HTMLVideoElement): Promise<void> => {
  if (isIOSDevice()) {
    await enterIOSFullscreen(video);
  } else {
    if (isFullscreen()) {
      await exitFullscreen();
    } else {
      await enterFullscreen(video);
    }
  }
};

/**
 * Sets video controls visibility (for fullscreen handling)
 */
export const setVideoControls = (video: HTMLVideoElement, enabled: boolean): void => {
  if (enabled) {
    video.setAttribute('controls', 'true');
    video.style.pointerEvents = 'auto';
  } else {
    video.removeAttribute('controls');
    video.style.pointerEvents = 'none';
  }
};

/**
 * Adds fullscreen change event listeners with cross-browser support
 */
export const addFullscreenListeners = (handler: () => void): (() => void) => {
  const events = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange'
  ];

  events.forEach(event => document.addEventListener(event, handler));

  // Return cleanup function
  return () => {
    events.forEach(event => document.removeEventListener(event, handler));
  };
};

/**
 * Adds iOS fullscreen event listeners
 */
export const addIOSFullscreenListeners = (
  video: HTMLVideoElement,
  onEnter: () => void,
  onExit: () => void
): (() => void) => {
  const videoEl = video as any;

  videoEl.addEventListener('webkitbeginfullscreen', onEnter);
  videoEl.addEventListener('webkitendfullscreen', onExit);

  // Return cleanup function
  return () => {
    videoEl.removeEventListener('webkitbeginfullscreen', onEnter);
    videoEl.removeEventListener('webkitendfullscreen', onExit);
  };
};

/**
 * Formats time in MM:SS format
 */
export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calculates seek time based on click position
 */
export const calculateSeekTime = (
  clientX: number,
  element: HTMLElement,
  duration: number
): number => {
  const rect = element.getBoundingClientRect();
  const clickX = clientX - rect.left;
  const clickPercentage = Math.max(0, Math.min(1, clickX / rect.width));
  return clickPercentage * duration;
};
