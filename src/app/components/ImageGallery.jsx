'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getImageUrl, getPlaceholderImage } from '@/services/imageService';

/**
 * ImageGallery Component
 * Displays auction images with main view, thumbnails, and lightbox modal
 * 
 * @param {Array} images - Array of image objects { imageId, imageUrl, altText, isPrimary, displayOrder }
 * @param {string} className - Optional additional CSS classes
 */
const ImageGallery = ({ images = [], className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Sort images by display order and put primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.displayOrder - b.displayOrder;
  });

  const currentImage = sortedImages[currentIndex];

  // Reset to first image when images prop changes
  useEffect(() => {
    setCurrentIndex(0);
    setImageErrors({});
  }, [images]);

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, currentIndex]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
    setIsLoading(true);
  }, [sortedImages.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
    setIsLoading(true);
  }, [sortedImages.length]);

  const handleImageError = (imageId) => {
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const getImageSource = (imageUrl) => {
    return getImageUrl(imageUrl) || getPlaceholderImage();
  };

  // No images state
  if (!sortedImages || sortedImages.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg 
              className="w-24 h-24 mx-auto mb-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-lg font-medium">No images available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`w-full ${className}`}>
        {/* Main Image Display */}
        <div className="relative group">
          <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden relative">
            {/* Loading Skeleton */}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            {/* Main Image */}
            <img
              src={getImageSource(currentImage?.imageUrl)}
              alt={currentImage?.altText || `Auction image ${currentIndex + 1}`}
              className={`w-full h-full object-cover cursor-zoom-in transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={() => handleImageError(currentImage?.imageId)}
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Image Counter */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
              {currentIndex + 1} / {sortedImages.length}
            </div>

            {/* Primary Badge */}
            {currentImage?.isPrimary && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Primary</span>
              </div>
            )}

            {/* Navigation Arrows (show on hover) */}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Zoom Hint */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span>Click to enlarge</span>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {sortedImages.length > 1 && (
            <div className="mt-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="flex space-x-3 pb-2">
                {sortedImages.map((image, index) => (
                  <button
                    key={image.imageId}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsLoading(true);
                    }}
                    className={`
                      relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200
                      ${currentIndex === index 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-400'
                      }
                    `}
                  >
                    <img
                      src={getImageSource(image.imageUrl)}
                      alt={image.altText || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(image.imageId)}
                    />
                    
                    {/* Primary star on thumbnail */}
                    {image.isPrimary && (
                      <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-all duration-200 z-10"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
            {currentIndex + 1} / {sortedImages.length}
          </div>

          {/* Main Lightbox Image */}
          <div 
            className="relative max-w-7xl max-h-[90vh] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageSource(currentImage?.imageUrl)}
              alt={currentImage?.altText || `Full size image ${currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={() => handleImageError(currentImage?.imageId)}
            />
          </div>

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full shadow-xl transition-all duration-200 transform hover:scale-110"
                aria-label="Previous image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full shadow-xl transition-all duration-200 transform hover:scale-110"
                aria-label="Next image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Keyboard Hints */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg text-xs backdrop-blur-sm flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white bg-opacity-20 rounded">←</kbd>
              <kbd className="px-2 py-1 bg-white bg-opacity-20 rounded">→</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white bg-opacity-20 rounded">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
