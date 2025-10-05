'use client';

import React from 'react';
import items from '../../../data/item.json';

const AuctionItems = () => {
  // Enhanced item data with additional auction properties
  const enhancedItems = items.map((item, index) => ({
    ...item,
    category: getCategory(item.title),
    location: getLocation(index),
    rating: (4.6 + Math.random() * 0.4).toFixed(1),
    totalBids: Math.floor(Math.random() * 50) + 15,
    percentageIncrease: Math.floor(Math.random() * 100) + 25,
    timeRemaining: getTimeRemaining(index),
    isPremium: item.price > 5000, // Items over $5000 are premium
    isEnding: index < 2, // First two items are ending soon
    isLive: index >= 2 && index < 4, // Next two are live
  }));

  function getCategory(title) {
    if (title.includes('iPhone') || title.includes('Laptop')) return 'Electronics';
    if (title.includes('Rolex')) return 'Watches & Jewelry';
    if (title.includes('Backpack')) return 'Fashion & Accessories';
    if (title.includes('Tesla') || title.includes('Rolls Royce')) return 'Vehicles';
    return 'Collectibles';
  }

  function getLocation(index) {
    const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL', 'Seattle, WA', 'Boston, MA'];
    return locations[index % locations.length];
  }

  function getTimeRemaining(index) {
    const times = ['2d 14h 30m', '18h 45m', '5d 12h 15m', '1d 8h 45m', '3d 22h 10m', '4d 16h 25m'];
    return times[index % times.length];
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {enhancedItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
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
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=📷`;
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
                    <span>{item.timeRemaining}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
            View All Premium Auctions
          </button>
        </div>
      </div>
    </section>
  );
};

export default AuctionItems;
