import React from 'react';
import { StarRating } from '@/components/ui/StarRating';

interface TestimonialCardProps {
  name: string;
  quote: string;
  videoId: string;
  videoSrc: string;
  poster?: string;
  avatarLetter: string;
  CustomVideoPlayer: React.ComponentType<{
    videoSrc: string;
    videoId: string;
    className?: string;
    poster?: string;
  }>;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  quote,
  videoId,
  videoSrc,
  poster,
  avatarLetter,
  CustomVideoPlayer
}) => {
  return (
    <div className="bg-white lg:bg-gray-50 rounded-2xl p-6 lg:p-12 relative shadow-xl">
      {/* Mobile Design */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg" style={{width: '100%', maxWidth: '400px', margin: '0 auto'}}>
          {/* Video Section */}
          <div className="relative">
            <CustomVideoPlayer
              videoSrc={videoSrc}
              videoId={`${videoId}-mobile`}
              className="w-full h-full aspect-video"
              poster={poster}
            />
          </div>

          {/* Content Section */}
          <div className="p-6 text-center">
            {/* Profile Image */}
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                {avatarLetter}
              </div>
            </div>

            {/* Name and Title */}
            <h4 className="text-xl font-bold text-gray-900 mb-1">{name}</h4>

            {/* Stars */}
            <StarRating size="w-6 h-6" />

            {/* Quote */}
            <p className="text-gray-700 text-lg leading-relaxed" style={{marginTop: '10px'}}>
              {quote}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Design */}
      <div className="hidden lg:block lg:flex">
        <div className="grid grid-cols-2 gap-12 items-center">
          {/* Video Player Left */}
          <div className="relative w-full">
            <div className="bg-white rounded-lg overflow-hidden shadow-lg" style={{width: '400px', height: '270px'}}>
              <CustomVideoPlayer
                videoSrc={videoSrc}
                videoId={`${videoId}-desktop`}
                className="w-full h-full"
                poster={poster}
              />
            </div>
          </div>

          {/* Results Right */}
          <div className="text-center">
            {/* Profile */}
            <div className="flex items-center justify-center mb-2">
              <div>
                <h4 className="text-2xl font-bold text-gray-900">{name}</h4>
              </div>
            </div>

            {/* Stars */}
            <div style={{marginTop: '40px', marginBottom: '20px'}}>
              <StarRating size="w-8 h-8" />
            </div>

            {/* Description */}
            <p className="text-lg text-gray-700" style={{marginTop: '10px'}}>
              {quote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
