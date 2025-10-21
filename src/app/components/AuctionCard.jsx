'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getImageUrl, getPlaceholderImage } from '@/services/imageService';

/**
 * AuctionCard Component
 * Displays auction card with lazy-loaded images, hover effects, and responsive design
 * 
 * @param {Object} auction - Auction object with auctionId, title, primaryImageUrl, currentPrice, category, etc.
 */
const AuctionCard = ({ auction }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  // Get image URL with proper formatting
  const getAuctionImageUrl = () => {
    if (hasError) return getPlaceholderImage();
    
    if (auction.primaryImageUrl) {
      return getImageUrl(auction.primaryImageUrl);
    }
    
    if (auction.imageUrls && auction.imageUrls.length > 0) {
      return getImageUrl(auction.imageUrls[0]);
    }
    
    if (auction.images && auction.images.length > 0) {
      const firstImage = auction.images[0];
      if (typeof firstImage === 'string') {
        return getImageUrl(firstImage);
      }
      if (firstImage.imageUrl) {
        return getImageUrl(firstImage.imageUrl);
      }
    }
    
    return getPlaceholderImage();
  };

  const handleImageError = () => {
    console.warn(`Failed to load image for auction: ${auction.title}`);
    setHasError(true);
    setIsLoaded(true);
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!auction.endTime) return 'N/A';
    
    const now = new Date();
    const end = new Date(auction.endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const imageUrl = getAuctionImageUrl();
  const auctionId = auction.auctionId || auction.id;
  const currentPrice = auction.currentPrice || auction.startingPrice || 0;
  const bidCount = auction.bidCount || auction.totalBids || 0;
  const category = auction.category || 'Uncategorized';
  const timeRemaining = getTimeRemaining();

  return (
    <Link href={`/auction/${auctionId}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden group cursor-pointer">
        {/* Image Container */}
        <div 
          ref={imgRef}
          className="relative w-full aspect-[4/3] bg-gray-200 overflow-hidden"
        >
          {/* Loading Skeleton */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
          )}

          {/* Image */}
          {isInView && (
            <img
              src={imageUrl}
              alt={auction.title || 'Auction item'}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          )}

          {/* Time Remaining Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{timeRemaining}</span>
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3 bg-[#22304a]/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
            <span className="text-xs font-medium text-white">{category}</span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#3b82f6] transition-colors">
            {auction.title || 'Untitled Auction'}
          </h3>

          {/* Price and Bids */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Current Bid</div>
              <div className="text-2xl font-bold text-[#22304a]">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {bidCount > 0 && (
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-0.5">Bids</div>
                <div className="text-lg font-semibold text-gray-700">{bidCount}</div>
              </div>
            )}
          </div>

          {/* Seller Info */}
          {auction.seller && (
            <div className="flex items-center gap-2 text-sm text-gray-600 border-t pt-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate">
                {typeof auction.seller === 'object' 
                  ? `${auction.seller.firstName || ''} ${auction.seller.lastName || ''}`.trim() || 'Anonymous'
                  : auction.seller
                }
              </span>
            </div>
          )}
        </div>

        {/* Hover Indicator */}
        <div className="h-1 bg-gradient-to-r from-[#3b82f6] to-[#22304a] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>
    </Link>
  );
};

export default AuctionCard;
