'use client';

import React, { useState, useEffect } from 'react';
import { Search, Play } from 'lucide-react';
import LiveStatistics from './LiveStatistics';
import { auctionAPI } from '../../../lib/auctionApi';
import { useRouter } from 'next/navigation';

const HeroSection = () => {
  const [featuredAuction, setFeaturedAuction] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const router = useRouter();

  // Fetch latest auction from backend
  useEffect(() => {
    const fetchFeaturedAuction = async () => {
      try {
        const response = await auctionAPI.getAuctions();
        const auctionData = response.data || response || [];
        
        if (Array.isArray(auctionData) && auctionData.length > 0) {
          // Get the most recently added auction (latest seller item)
          const latestAuction = auctionData.sort((a, b) => 
            new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime)
          )[0];
          
          setFeaturedAuction(latestAuction);
        }
      } catch (error) {
        console.error('Error fetching featured auction:', error);
      }
    };

    fetchFeaturedAuction();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!featuredAuction || !featuredAuction.endTime) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(featuredAuction.endTime);
      const difference = end.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [featuredAuction]);

  const handleViewAuction = () => {
    if (featuredAuction) {
      router.push(`/auction/${featuredAuction.id}`);
    }
  };

  const getAuctionImage = () => {
    if (!featuredAuction) return null;
    
    // Try different image sources from backend
    if (featuredAuction.primaryImageUrl) return featuredAuction.primaryImageUrl;
    if (featuredAuction.imageUrls && featuredAuction.imageUrls.length > 0) return featuredAuction.imageUrls[0];
    if (featuredAuction.images && Array.isArray(featuredAuction.images) && featuredAuction.images.length > 0) {
      return featuredAuction.images[0];
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Trust Badge */}
            <div className="inline-flex items-center bg-slate-800 rounded-full px-4 py-2 mb-8 border border-slate-700">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm text-gray-300">Trusted by 196,000+ collectors worldwide</span>
            </div>

            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-2">
                Discover
              </h1>
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight mb-2">
                <span className="text-yellow-400">Extraordinary</span>
              </h2>
              <h3 className="text-5xl lg:text-6xl font-bold leading-tight">
                Auctions
              </h3>
            </div>

            {/* Description */}
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Join the world's most prestigious online auction house. Bid on rare collectibles, 
              luxury items, and one-of-a-kind treasures from verified sellers globally.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search auctions, brands, categories..."
                  className="w-full px-6 py-4 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-slate-500"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              </div>
              <button className="px-8 py-4 bg-yellow-400 text-slate-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center">
                <Search className="w-5 h-5 mr-2" />
                Search
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button className="px-6 py-3 bg-transparent border border-gray-400 text-gray-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-colors">
                Browse Auctions →
              </button>
              <button className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                Advanced Search
              </button>
            </div>

            {/* Popular Categories */}
            <div>
              <p className="text-gray-400 mb-4">Popular Categories:</p>
              <div className="flex flex-wrap gap-3">
                {['Art & Antiques', 'Luxury Watches', 'Classic Cars', 'Fine Jewelry', 'Collectibles', 'Electronics'].map((category) => (
                  <button
                    key={category}
                    className="px-4 py-2 bg-slate-800 text-gray-300 rounded-full hover:bg-yellow-400 hover:text-slate-900 transition-colors text-sm"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Statistics & Featured Auction */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Live Statistics Card */}
            <LiveStatistics />

            {/* Featured Auction Card */}
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-200">Latest Auction</h3>
                <span className="text-xs bg-yellow-400 text-slate-900 px-2 py-1 rounded uppercase font-bold">New</span>
              </div>
              
              {/* Auction Image */}
              <div className="flex items-center justify-center mb-4 bg-slate-700/50 rounded-xl overflow-hidden" style={{ height: '200px' }}>
                {getAuctionImage() ? (
                  <img 
                    src={getAuctionImage()} 
                    alt={featuredAuction?.title || "Featured Auction"} 
                    className="max-h-full max-w-full object-contain" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">No image available</span>
                  </div>
                )}
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-2">
                {featuredAuction?.title || 'Loading...'}
              </h4>
              <p className="text-yellow-400 text-xl font-bold mb-3">
                Current bid: ${featuredAuction ? (featuredAuction.currentPrice || featuredAuction.startingPrice).toLocaleString() : '0'}
              </p>
              
              {/* Countdown Timer */}
              {featuredAuction && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Ends in:</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div>
                      <div className="text-xs text-gray-400">days</div>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                      <div className="text-xs text-gray-400">hrs</div>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                      <div className="text-xs text-gray-400">min</div>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                      <div className="text-xs text-gray-400">sec</div>
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={handleViewAuction}
                className="w-full py-3 bg-yellow-400 text-slate-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!featuredAuction}
              >
                <Play className="w-5 h-5 mr-2" />
                View Auction
              </button>
            </div>
          </div>
        </div>

        {/* Auction Items Section */}
        
      </div>
    </div>
  );
};

export default HeroSection;