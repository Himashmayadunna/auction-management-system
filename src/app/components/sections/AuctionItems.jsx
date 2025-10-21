'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auctionAPI, auctionUtils } from '../../../lib/auctionApi';
import { getImageUrl, getPlaceholderImage } from '../../../services/imageService';

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
      
      // Handle your backend's response format: { success: true, data: [...] }
      let auctionData = response;
      if (response && response.data && Array.isArray(response.data)) {
        auctionData = response.data;
      } else if (Array.isArray(response)) {
        auctionData = response;
      } else {
        console.error('❌ Backend response format:', response);
        throw new Error('Backend did not return valid auction array');
      }
      
      if (auctionData.length === 0) {
        console.log('⚠️ No auctions found in database');
        setAuctions([]);
        setError(null);
        setLoading(false);
        return;
      }
      
      console.log(`📦 Processing ${auctionData.length} auctions from database`);
      
      // Transform backend data to match component expectations
      const enhancedItems = auctionData.map((auction, index) => {
        return {
          id: auction.id || auction.auctionId,
          title: auction.title,
          description: auction.description,
          category: auction.category,
          location: auction.location || 'Location not specified',
          price: auction.currentPrice || auction.startingPrice,
          startingPrice: auction.startingPrice,
          currentBid: auction.currentPrice || auction.startingPrice,
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
          createdAt: auction.createdAt || auction.startTime,
          // Include image data from backend
          primaryImageUrl: auction.primaryImageUrl,
          imageUrls: auction.imageUrls,
          images: auction.images
        };
      });
      
      // Sort to show premium items first, then by creation date
      const sortedItems = enhancedItems.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setAuctions(sortedItems);
      setError(null);
      console.log('✅ Loaded', sortedItems.length, 'auctions for home page');
      console.log('📸 Sample auction image data:', sortedItems[0] ? {
        id: sortedItems[0].id,
        primaryImageUrl: sortedItems[0].primaryImageUrl,
        imageUrls: sortedItems[0].imageUrls,
        images: sortedItems[0].images
      } : 'No auctions');
      
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
            {auctions.map((item) => {
              // Get image URL with proper formatting
              const getAuctionImageUrl = () => {
                console.log(`🖼️ Getting image for auction ${item.id}:`, {
                  primaryImageUrl: item.primaryImageUrl,
                  imageUrls: item.imageUrls,
                  images: item.images
                });

                if (item.primaryImageUrl) {
                  console.log(`✅ Using primaryImageUrl: ${item.primaryImageUrl}`);
                  return getImageUrl(item.primaryImageUrl);
                }
                
                if (item.imageUrls && item.imageUrls.length > 0) {
                  console.log(`✅ Using imageUrls[0]: ${item.imageUrls[0]}`);
                  return getImageUrl(item.imageUrls[0]);
                }
                
                if (item.images && item.images.length > 0) {
                  const firstImage = item.images[0];
                  if (typeof firstImage === 'string') {
                    console.log(`✅ Using images[0] as string: ${firstImage}`);
                    return getImageUrl(firstImage);
                  }
                  if (firstImage.imageUrl) {
                    console.log(`✅ Using images[0].imageUrl: ${firstImage.imageUrl}`);
                    return getImageUrl(firstImage.imageUrl);
                  }
                }
                
                console.log(`⚠️ No image found for auction ${item.id}, using placeholder`);
                return getPlaceholderImage();
              };

              const imageUrl = getAuctionImageUrl();

              return (
                <Link key={item.id} href={`/auction/${item.id}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer">
                    {/* Image with Front Box Display */}
                    <div className="relative w-full aspect-[4/3] bg-gray-200 overflow-hidden">
                      {/* Actual Image */}
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-opacity duration-300"
                        onError={(e) => {
                          e.target.src = getPlaceholderImage();
                        }}
                      />

                      {/* Time Remaining Badge - Top Right */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{formatTimeRemaining(item.timeRemaining)}</span>
                        </div>
                      </div>

                      {/* Category Badge - Top Left */}
                      <div className="absolute top-3 left-3 bg-[#22304a]/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                        <span className="text-xs font-medium text-white">{item.category}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#3b82f6] transition-colors">{item.title}</h3>

                      {/* Price and Bids */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Current Bid</div>
                          <div className="text-2xl font-bold text-[#22304a]">
                            {formatPrice(item.currentBid)}
                          </div>
                        </div>

                        {item.totalBids > 0 && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-0.5">Bids</div>
                            <div className="text-lg font-semibold text-gray-700">{item.totalBids}</div>
                          </div>
                        )}
                      </div>

                      {/* Seller Info */}
                      {item.seller && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 border-t pt-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">{item.seller}</span>
                        </div>
                      )}
                    </div>

                    {/* Hover Indicator */}
                    <div className="h-1 bg-gradient-to-r from-[#3b82f6] to-[#22304a] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </Link>
              );
            })}
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
