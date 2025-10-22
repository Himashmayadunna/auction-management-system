'use client';

import React from 'react';
import Link from 'next/link';

const AuctionCard = ({ auction }) => {
  const getAuctionImage = () => {
    if (auction.primaryImageUrl) return auction.primaryImageUrl;
    if (auction.imageUrls && auction.imageUrls.length > 0) return auction.imageUrls[0];
    if (auction.images && Array.isArray(auction.images) && auction.images.length > 0) {
      return auction.images[0];
    }
    return '/rolex.jpg';
  };

  return (
    <Link href={`/auction/${auction.id || auction.auctionId}`}>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100">
        {/* Image */}
        <div className="relative h-48 bg-gray-100">
          <img 
            src={getAuctionImage()}
            alt={auction.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/rolex.jpg';
            }}
          />
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              Live
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            {auction.category || 'General'}
          </p>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 hover:text-[#22304a] transition-colors">
            {auction.title}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-[#22304a]">
              ${(auction.currentPrice || auction.startingPrice).toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">Current Bid</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{auction.bidCount || 0} bids</span>
            </div>
            <div className="flex items-center text-blue-600 font-medium">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AuctionCard;
