'use client';

import React, { useState, useEffect } from 'react';
import { Search, Play } from 'lucide-react';
import LiveStatistics from './LiveStatistics';


const HeroSection = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 32,
    seconds: 45
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;
        let newDays = prev.days;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes -= 1;
        }
        if (newMinutes < 0) {
          newMinutes = 59;
          newHours -= 1;
        }
        if (newHours < 0) {
          newHours = 23;
          newDays -= 1;
        }

        return {
          days: newDays,
          hours: newHours,
          minutes: newMinutes,
          seconds: newSeconds
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
                <h3 className="text-lg font-semibold text-gray-200">Featured Auction</h3>
                <span className="text-xs bg-yellow-400 text-slate-900 px-2 py-1 rounded uppercase font-bold">Featured</span>
              </div>
              
              {/* Auction Image Placeholder */}
              <div className=" flex items-center justify-left mb-4">
                <img 
                  src="/rolex1.jpeg" 
                  alt="Rolex Preview" 
                  className="h-50 w-full object-contain mx-auto" 
                  style={{ fitContent: 'contain' }}    
                />
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-2">Vintage Rolex Submariner 1960s</h4>
              <p className="text-yellow-400 text-xl font-bold mb-3">Current bid: $12,500</p>
              
              {/* Countdown Timer */}
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Ends in:</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-700 rounded p-2">
                    <div className="text-xl font-bold">{timeLeft.days}</div>
                    <div className="text-xs text-gray-400">days</div>
                  </div>
                  <div className="bg-slate-700 rounded p-2">
                    <div className="text-xl font-bold">{timeLeft.hours}</div>
                    <div className="text-xs text-gray-400">hrs</div>
                  </div>
                  <div className="bg-slate-700 rounded p-2">
                    <div className="text-xl font-bold">{timeLeft.minutes}</div>
                    <div className="text-xs text-gray-400">min</div>
                  </div>
                  <div className="bg-slate-700 rounded p-2">
                    <div className="text-xl font-bold">{timeLeft.seconds}</div>
                    <div className="text-xs text-gray-400">sec</div>
                  </div>
                </div>
              </div>
              
              <button className="w-full py-3 bg-yellow-400 text-slate-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center">
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