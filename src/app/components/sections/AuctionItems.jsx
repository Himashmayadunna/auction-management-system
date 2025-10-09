'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auctionAPI, auctionUtils } from '../../../lib/auctionApi';

const AuctionItems = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🎯 AuctionItems component render - auctions:', auctions.length, 'loading:', loading);

  // Helper functions for time calculations
  const calculateTimeRemaining = (endTime) => {
    try {
      const now = new Date();
      const end = new Date(endTime);
      const difference = end.getTime() - now.getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, isExpired: true };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      return { days, hours, minutes, isExpired: false };
    } catch (error) {
      return { days: 1, hours: 12, minutes: 30, isExpired: false };
    }
  };

  const isAuctionLive = (startTime, endTime) => {
    try {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);
      return now >= start && now <= end;
    } catch (error) {
      return true;
    }
  };

  // Fetch auctions from backend
  const fetchAuctions = async () => {
    try {
      setLoading(true);
      
      console.log('🔧 AuctionItems: Attempting to fetch auctions from backend API');
      
      // Fetch auction data from backend/database ONLY
      console.log('🔧 Fetching auctions from backend API: http://localhost:5000/api/Auctions');
      
      const response = await auctionAPI.getAuctions();
      console.log('✅ Backend response received:', response);
      
      // Ensure we have valid data from backend
      if (!Array.isArray(response)) {
        throw new Error('Backend did not return valid auction array');
      }
      
      if (response.length === 0) {
        console.log('⚠️ No auctions found in database');
        setAuctions([]);
        setError(null);
        setLoading(false);
        return;
      }
      
      console.log(`📦 Processing ${response.length} auctions from database`);
      
      // Transform backend data to match component expectations
      const enhancedItems = (response.data || response || []).map((auction, index) => ({
        id: auction.id,
        title: auction.title,
        description: auction.description,
        category: auction.category,
        location: auction.location || 'Location not specified',
        price: auction.currentPrice || auction.startingPrice,
        startingPrice: auction.startingPrice,
        currentBid: auction.currentPrice || auction.startingPrice,
        images: Array.isArray(auction.images) ? auction.images : [auction.images || '/rolex.jpg'],
        rating: (4.6 + ((auction.id || index) % 4) * 0.1).toFixed(1),
        totalBids: auction.bidCount || (15 + ((auction.id || index) % 35)),
        percentageIncrease: 25 + ((auction.id || index) % 75),
        timeRemaining: auction.endTime ? calculateTimeRemaining(auction.endTime) : { days: 1, hours: 12, minutes: 30, isExpired: false },
        isPremium: auction.startingPrice > 1000, // Lower threshold for more premium items
        isEnding: auction.endTime ? calculateTimeRemaining(auction.endTime).days < 1 : false,
        isLive: auction.startTime && auction.endTime ? isAuctionLive(auction.startTime, auction.endTime) : true,
        endTime: auction.endTime,
        startTime: auction.startTime,
        sellerId: auction.sellerId,
        seller: auction.seller && typeof auction.seller === 'object' ? 
          `${auction.seller.firstName || ''} ${auction.seller.lastName || ''}`.trim() || 'Anonymous' : 
          (typeof auction.seller === 'string' ? auction.seller : 'Anonymous'),
        condition: auction.condition || 'Good',
        createdAt: auction.createdAt || auction.startTime
      }));
      
      // Sort to show premium items first, then by creation date
      const sortedItems = enhancedItems.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setAuctions(sortedItems);
      setError(null);
      console.log('✅ Loaded', sortedItems.length, 'auctions for home page');
      
    } catch (err) {
      console.error('❌ Error in fetchAuctions:', err);
      setError(err.message);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Refresh auctions every 30 seconds to show newly published items
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAuctions();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatTimeRemaining = (timeData) => {
    if (timeData.isExpired) return 'Auction ended';
    return `${timeData.days}d ${timeData.hours}h ${timeData.minutes}m`;
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-gray-600">Loading auctions...</div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    const isDatabaseError = error.includes('SQL Server') || error.includes('database');
    
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-800">
                {isDatabaseError ? 'Database Connection Issue' : 'Connection Error'}
              </h3>
            </div>
            <div className="text-red-700 mb-4">
              {error}
            </div>
            
            {isDatabaseError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 text-left">
                <h4 className="font-medium text-yellow-800 mb-2">🔧 Quick Fix Steps:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Check if SQL Server is running on your machine</li>
                  <li>2. Verify your backend's database connection string</li>
                  <li>3. Run: <code className="bg-yellow-100 px-1 rounded">dotnet ef database update</code></li>
                  <li>4. See <code className="bg-yellow-100 px-1 rounded">DATABASE_TROUBLESHOOTING.md</code> for detailed help</li>
                </ol>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center mb-4">
            <span className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
              Featured
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Premium Auctions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Curated selection of exceptional items from verified sellers
          </p>
        </div>

        {/* Grid of auction items */}
        {auctions.length === 0 ? (
          <div className="text-center text-gray-600">No auctions available at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctions.map((item) => (
            <Link key={item.id} href={`/auction/${item.id}`}>
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer">
              {/* Image and badges */}
              <div className="relative h-48 bg-gray-200">
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                  {item.isEnding && (
                    <span className="bg-orange-500 text-white px-2 py-1 text-xs font-medium rounded">
                      Ending
                    </span>
                  )}
                </div>
                
                <img
                  src={Array.isArray(item.images) ? item.images[0] : item.images || '/rolex.jpg'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/rolex.jpg'; // Fallback to your existing image
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Category and Location */}
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span>{item.category}</span>
                  <span className="mx-1">•</span>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{item.location}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>

                {/* Seller info */}
                <div className="flex items-center mb-3">
                  <span className="text-blue-600 text-sm font-medium">{item.seller}</span>
                  <div className="flex items-center ml-2">
                    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm text-gray-600 ml-1">{item.rating}</span>
                  </div>
                </div>

                {/* Current Bid */}
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Current Bid</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">{formatPrice(item.currentBid)}</span>
                    <span className="text-green-600 text-sm font-medium">+{item.percentageIncrease}%</span>
                  </div>
                </div>

                {/* Bids and Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{item.totalBids} bids</span>
                  </div>
                  <div className="flex items-center text-orange-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatTimeRemaining(item.timeRemaining)}</span>
                  </div>
                </div>
              </div>
              </div>
            </Link>
          ))}
        </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/auctions">
            <button className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
              View All Premium Auctions
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AuctionItems;
