'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ImageDisplay from './ImageDisplay';
import { getPrimaryImage, sortImagesByOrder } from '../../../lib/imageUtils';

const ImageGallery = ({
  images = [],
  className = '',
  showThumbnails = true,
  allowZoom = true,
  showCounter = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [sortedImages, setSortedImages] = useState([]);

  useEffect(() => {
    if (Array.isArray(images) && images.length > 0) {
      const sorted = sortImagesByOrder(images);
      setSortedImages(sorted);
      
      // Set current index to primary image if it exists
      const primaryImage = getPrimaryImage(sorted);
      if (primaryImage) {
        const primaryIndex = sorted.findIndex(img => 
          (img.imageId || img.id) === (primaryImage.imageId || primaryImage.id)
        );
        if (primaryIndex !== -1) {
          setCurrentIndex(primaryIndex);
        }
      }
    } else {
      setSortedImages([]);
      setCurrentIndex(0);
    }
  }, [images]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
  }, [sortedImages.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  }, [sortedImages.length]);

  const goToIndex = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious]);

  if (!sortedImages.length) {
    return (
      <div className={`w-full ${className}`}>
        <div className="aspect-square md:aspect-video bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-medium">No images available</p>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = sortedImages[currentIndex];

  return (
    <div className={`w-full ${className}`}>
      {/* Main Image Display */}
      <div className="relative">
        <div className={`relative aspect-square md:aspect-video rounded-lg overflow-hidden bg-gray-100 ${allowZoom ? 'cursor-zoom-in' : ''}`}>
          <ImageDisplay
            imageUrl={currentImage?.imageUrl || currentImage?.ImageUrl}
            altText={currentImage?.altText || currentImage?.AltText || 'Auction image'}
            size="large"
            className="w-full h-full"
            onClick={allowZoom ? () => setIsZoomed(true) : undefined}
          />
          
          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}
          
          {/* Image Counter */}
          {showCounter && sortedImages.length > 1 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} of {sortedImages.length}
            </div>
          )}
          
          {/* Zoom Indicator */}
          {allowZoom && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && sortedImages.length > 1 && (
        <div className="mt-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {sortedImages.map((image, index) => (
              <button
                key={image.imageId || image.id || index}
                onClick={() => goToIndex(index)}
                className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ImageDisplay
                  imageUrl={image.imageUrl || image.ImageUrl}
                  altText={image.altText || image.AltText || `Thumbnail ${index + 1}`}
                  size="thumbnail"
                  className="w-20 h-15"
                />
                
                {/* Primary Badge on Thumbnail */}
                {(image.isPrimary || image.IsPrimary) && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                    1st
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={currentImage?.imageUrl || currentImage?.ImageUrl}
              alt={currentImage?.altText || currentImage?.AltText || 'Zoomed image'}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Close Button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
              aria-label="Close zoom"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Navigation in Zoom */}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                  aria-label="Previous image"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                  aria-label="Next image"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Counter in Zoom */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                  {currentIndex + 1} of {sortedImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;