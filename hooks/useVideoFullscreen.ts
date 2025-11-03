import { useEffect, RefObject } from 'react';
import {
  isFullscreen,
  setVideoControls,
  addFullscreenListeners,
  addIOSFullscreenListeners
} from '@/lib/videoUtils';

/**
 * Custom hook to handle fullscreen behavior for video elements
 * Manages native controls visibility based on fullscreen state
 */
export const useVideoFullscreen = (videoRef: RefObject<HTMLVideoElement>) => {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleFullscreenChange = () => {
      if (!videoRef.current) return;

      const isFS = isFullscreen();
      console.log('Fullscreen change detected, isFullscreen:', isFS);

      // Enable native controls in fullscreen for better compatibility
      setVideoControls(videoRef.current, isFS);
    };

    const handleWebkitBeginFullscreen = () => {
      console.log('iOS fullscreen begin');
      if (videoRef.current) {
        setVideoControls(videoRef.current, true);
      }
    };

    const handleWebkitEndFullscreen = () => {
      console.log('iOS fullscreen end');
      if (videoRef.current) {
        setVideoControls(videoRef.current, false);
      }
    };

    // Setup listeners
    const cleanupFullscreen = addFullscreenListeners(handleFullscreenChange);
    const cleanupIOS = addIOSFullscreenListeners(
      video,
      handleWebkitBeginFullscreen,
      handleWebkitEndFullscreen
    );

    // Trigger check on mount in case already in fullscreen
    handleFullscreenChange();

    return () => {
      cleanupFullscreen();
      cleanupIOS();
    };
  }, [videoRef]);
};
