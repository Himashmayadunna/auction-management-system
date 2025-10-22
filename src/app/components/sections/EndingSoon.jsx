'use client';

import { useState, useEffect } from 'react';
import { auctionAPI } from '../../../lib/auctionApi';
import Link from 'next/link';

const EndingSoon = () => {
  const [endingSoonAuctions, setEndingSoonAuctions] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});
  const [loading, setLoading] = useState(true);

  // Helper function to calculate time remaining
  const calculateTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const difference = end.getTime() - now.getTime();

    if (difference <= 0) {
      return { totalHours: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const totalHours = difference / (1000 * 60 * 60);
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { totalHours, hours, minutes, seconds, isExpired: false };
  };

  // Fetch auctions from backend and filter those ending in 3 hours or less
  const fetchEndingSoonAuctions = async () => {
    try {
      setLoading(true);
      const response = await auctionAPI.getAuctions();
      const auctionData = response.data || response || [];
      
      if (Array.isArray(auctionData)) {
        // Filter auctions that end in 3 hours or less (180 minutes)
        const filtered = auctionData.filter(auction => {
          if (!auction.endTime) return false;
          const timeInfo = calculateTimeRemaining(auction.endTime);
          return !timeInfo.isExpired && timeInfo.totalHours <= 3;
        });

        // Sort by time remaining (soonest first)
        const sorted = filtered.sort((a, b) => {
          const timeA = calculateTimeRemaining(a.endTime);
          const timeB = calculateTimeRemaining(b.endTime);
          return timeA.totalHours - timeB.totalHours;
        });

        setEndingSoonAuctions(sorted);
      }
    } catch (error) {
      console.error('Error fetching ending soon auctions:', error);
      setEndingSoonAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndingSoonAuctions();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchEndingSoonAuctions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = {};
      endingSoonAuctions.forEach(auction => {
        newTimeLeft[auction.id] = calculateTimeRemaining(auction.endTime);
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [endingSoonAuctions]);

  const formatTime = (time) => {
    if (!time || time.isExpired) return "Ended";
    if (time.hours === 0) {
      return `${time.minutes}m ${time.seconds}s`;
    }
    return `${time.hours}h ${time.minutes}m`;
  };

  const getAuctionImage = (auction) => {
    if (auction.primaryImageUrl) return auction.primaryImageUrl;
    if (auction.imageUrls && auction.imageUrls.length > 0) return auction.imageUrls[0];
    if (auction.images && Array.isArray(auction.images) && auction.images.length > 0) {
      return auction.images[0];
    }
    return '/rolex.jpg';
  };

  // Don't render if no ending soon auctions
  if (loading) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22304a] mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (endingSoonAuctions.length === 0) {
    return null; // Don't show section if no auctions ending soon
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">🔥 Ending Soon</h2>
            <p className="text-gray-600 mt-2">Last chance! These auctions end in 3 hours or less</p>
          </div>
          <div className="text-orange-500 animate-pulse">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Grid of auction items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {endingSoonAuctions.map((auction) => (
            <Link key={auction.id} href={`/auction/${auction.id}`}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer">
                {/* Image and badges */}
                <div className="relative h-48 bg-gray-200">
                  <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 animate-pulse">
                      🔥 Ending Soon
                    </span>
                  </div>
                  <img 
                    src={getAuctionImage(auction)}
                    alt={auction.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/rolex.jpg';
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Category and Location */}
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span>{auction.category || 'General'}</span>
                    {auction.location && (
                      <>
                        <span className="mx-1">•</span>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{auction.location}</span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{auction.title}</h3>

                  {/* Seller info */}
                  {auction.seller && (
                    <div className="flex items-center mb-3">
                      <span className="text-sm text-blue-600">
                        {typeof auction.seller === 'object' 
                          ? `${auction.seller.firstName || ''} ${auction.seller.lastName || ''}`.trim()
                          : auction.seller}
                      </span>
                    </div>
                  )}

                  {/* Current bid */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Current Bid</p>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(auction.currentPrice || auction.startingPrice)}
                    </span>
                  </div>

                  {/* Time remaining with urgency styling */}
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                    <span className="text-xs font-medium text-orange-700">Time Left:</span>
                    <span className="text-sm font-bold text-orange-600">
                      {formatTime(timeLeft[auction.id])}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EndingSoon;