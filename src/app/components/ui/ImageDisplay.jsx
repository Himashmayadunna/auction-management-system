'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getImageUrl, createImagePlaceholder } from '../../../lib/imageUtils';

const ImageDisplay = ({
  imageUrl,
  altText = 'Image',
  size = 'medium',
  className = '',
  showSkeleton = true,
  fallbackText = 'No Image',
  priority = false,
  onError = null,
  onLoad = null
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    thumbnail: { width: 80, height: 60, className: 'w-20 h-15' },
    small: { width: 150, height: 112, className: 'w-38 h-28' },
    medium: { width: 300, height: 225, className: 'w-75 h-56' },
    large: { width: 600, height: 450, className: 'w-full h-96' },
    card: { width: 400, height: 300, className: 'w-full h-48' }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  useEffect(() => {
    if (imageUrl) {
      setImageSrc(getImageUrl(imageUrl));
      setError(false);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [imageUrl]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad && onLoad();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError && onError();
  };

  const renderSkeleton = () => (
    <div className={`${config.className} ${className} bg-gray-200 animate-pulse rounded-lg flex items-center justify-center`}>
      <div className="text-gray-400">
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );

  const renderPlaceholder = () => (
    <div className={`${config.className} ${className} bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center`}>
      <div className="text-center text-gray-500">
        <svg
          className="w-8 h-8 mx-auto mb-2"
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
        <span className="text-sm">{fallbackText}</span>
      </div>
    </div>
  );

  if (loading && showSkeleton) {
    return renderSkeleton();
  }

  if (error || !imageSrc) {
    return renderPlaceholder();
  }

  return (
    <div className={`${config.className} ${className} relative overflow-hidden rounded-lg`}>
      <Image
        ref={imgRef}
        src={imageSrc}
        alt={altText}
        width={config.width}
        height={config.height}
        className="object-cover w-full h-full"
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        sizes={`(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${config.width}px`}
      />
    </div>
  );
};

export default ImageDisplay;