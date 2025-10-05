'use client';

import { useState, useEffect } from 'react';

const LiveAuctions = () => {
  const [currentBids, setCurrentBids] = useState({});

  // Import items data
  const itemsData = [
    {
      "id": 1,
      "title": "iPhone 14 Pro",
      "description": "256GB, Deep Purple, excellent condition.",
      "price": 1200,
      "seller": "John Doe",
      "image": "/iphone 14.jpg"
    },
    {
      "id": 2,
      "title": "ASUS ROG Gaming Laptop",
      "description": "RTX 4070, 16GB RAM, 1TB SSD.",
      "price": 1800,
      "seller": "Alice Smith",
      "image": "/images/laptop.jpg"
    },
    {
      "id": 3,
      "title": "Rolex Submariner",
      "description": "Original Rolex Submariner, mint condition.",
      "price": 9500,
      "seller": "Michael Brown",
      "image": "/images/rolex.jpg"
    },
    {
      "id": 4,
      "title": "Monalisa Backpack",
      "description": "Monalisa Backpack, limited edition.",
      "price": 250,
      "seller": "Emily Davis",
      "image": "/images/monalisa_backpack.jpg"
    },
    {
      "id": 5,
      "title": "Tesla Model 3",
      "description": "Electric sedan with autopilot features.",
      "price": 35000,
      "seller": "Alice Smith",
      "image": "/images/tesla_model_3.jpg"
    },
    {
      "id": 6,
      "title": "Rolls Royce",
      "description": "Luxury sedan with top-notch features.",
      "price": 200000,
      "seller": "John Doe",
      "image": "/images/rolls_royce.jpg"
    }
  ];

  // Enhanced data for live auctions using item.json data
  const liveAuctionItems = itemsData.map((item, index) => ({
    ...item,
    category: getCategory(item.title),
    location: getLocation(index),
    rating: (4.6 + Math.random() * 0.4).toFixed(1),
    currentBid: item.price + Math.floor(Math.random() * 1000) + 200,
    totalBids: Math.floor(Math.random() * 80) + 25,
    percentageIncrease: Math.floor(Math.random() * 200) + 50,
    timeRemaining: getTimeRemaining(index),
    badges: item.price > 5000 ? ["Live", "Premium"] : ["Live"],
    isLive: true
  }));

  function getCategory(title) {
    if (title.includes('iPhone') || title.includes('Laptop')) return 'Electronics';
    if (title.includes('Rolex')) return 'Watches & Jewelry';
    if (title.includes('Backpack')) return 'Fashion & Accessories';
    if (title.includes('Tesla') || title.includes('Rolls Royce')) return 'Vehicles';
    return 'Collectibles';
  }

  function getLocation(index) {
    const locations = ['New York, NY', 'San Francisco, CA', 'Detroit, MI', 'Chicago, IL', 'Boston, MA', 'Miami, FL'];
    return locations[index % locations.length];
  }

  function getTimeRemaining(index) {
    const times = ["2d 14h 30m", "1d 8h 15m", "3d 22h 45m", "5d 10h 25m", "4d 18h 10m", "2d 6h 50m"];
    return times[index % times.length];
  }

  // Simulate live bidding updates
  useEffect(() => {
    const interval = setInterval(() => {
      const randomItem = liveAuctionItems[Math.floor(Math.random() * liveAuctionItems.length)];
      const bidIncrease = Math.floor(Math.random() * 500) + 50;
      
      setCurrentBids(prev => ({
        ...prev,
        [randomItem.id]: (prev[randomItem.id] || randomItem.currentBid) + bidIncrease
      }));
    }, 8000); // Update every 8 seconds

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

  const getCurrentBid = (item) => {
    return currentBids[item.id] || item.currentBid;
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Live Auctions</h2>
            <p className="text-gray-600 mt-2">Active bidding happening now</p>
          </div>
          <div className="flex items-center text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium">LIVE</span>
          </div>
        </div>

        {/* Grid of auction items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveAuctionItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              {/* Image and badges */}
              <div className="relative h-48 bg-gray-200">
                <div className="absolute top-3 left-3 flex gap-2">
                  {item.badges.map((badge, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        badge === 'Live'
                          ? 'bg-red-100 text-red-800'
                          : badge === 'Premium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                {/* Live indicator */}
                {item.isLive && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                      LIVE
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Category and Location */}
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <span>{item.category}</span>
                  <span className="mx-1">•</span>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{item.location}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>

                {/* Seller info */}
                <div className="flex items-center mb-3">
                  <span className="text-sm text-blue-600">{item.seller}</span>
                  <div className="flex items-center ml-2">
                    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm text-gray-600 ml-1">{item.rating}</span>
                  </div>
                </div>

                {/* Current bid */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Current Bid</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(getCurrentBid(item))}
                      </span>
                      <span className="text-sm text-green-600 ml-2">+{item.percentageIncrease}%</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{item.totalBids} bids</span>
                    </div>
                  </div>
                </div>

                {/* Bid button and time */}
                <div className="flex items-center justify-between">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
                    Bid Now
                  </button>
                  <div className="flex items-center text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs">{item.timeRemaining}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            View All Live Auctions
          </button>
        </div>
      </div>
    </section>
  );
};

export default LiveAuctions;