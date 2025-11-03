import { useEffect, RefObject, MutableRefObject } from 'react';
import { isFullscreen } from '@/lib/videoUtils';

/**
 * Custom hook to prevent forward seeking in fullscreen mode
 * Only applies to main VSL video, not testimonial videos
 */
export const useVideoSeeking = (
  videoRef: RefObject<HTMLVideoElement>,
  videoId: string,
  lastAllowedTimeRef: MutableRefObject<number>
) => {
  useEffect(() => {
    // Only apply seeking prevention to main-vsl video
    if (videoId !== 'main-vsl') return;

    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!videoRef.current) return;

      const currentTime = videoRef.current.currentTime;
      const lastAllowed = lastAllowedTimeRef.current || 0;

      // Check if in fullscreen
      const isFS = isFullscreen();

      // If in fullscreen and user jumped forward (seeking), prevent it
      if (isFS && currentTime > lastAllowed + 0.5) {
        console.log(
          'Forward seeking detected in fullscreen for',
          videoId,
          ', reverting from',
          currentTime,
          'to:',
          lastAllowed
        );
        videoRef.current.currentTime = lastAllowed;
        return;
      }

      // Update last allowed time only during normal playback or backward seeking
      if (currentTime <= lastAllowed + 0.5) {
        lastAllowedTimeRef.current = currentTime;
      }
    };

    const handleSeeking = () => {
      if (!videoRef.current) return;

      const currentTime = videoRef.current.currentTime;
      const lastAllowed = lastAllowedTimeRef.current || 0;

      // Check if in fullscreen
      const isFS = isFullscreen();

      // Block forward seeking in fullscreen
      if (isFS && currentTime > lastAllowed + 0.3) {
        console.log(
          'Seeking event for',
          videoId,
          ': preventing forward seek from',
          currentTime,
          'to:',
          lastAllowed
        );
        videoRef.current.currentTime = lastAllowed;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);

    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('seeking', handleSeeking);
      }
    };
  }, [videoId, videoRef, lastAllowedTimeRef]);
};
