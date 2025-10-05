'use client';

import { useState, useEffect } from 'react';

const EndingSoon = () => {
  const [timeLeft, setTimeLeft] = useState({});

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
    }
  ];

  // Enhanced data for ending soon auctions using item.json data
  const endingSoonItems = itemsData.map((item, index) => ({
    ...item,
    category: getCategory(item.title),
    location: getLocation(index),
    rating: (4.6 + Math.random() * 0.4).toFixed(1),
    currentBid: item.price + Math.floor(Math.random() * 500),
    totalBids: Math.floor(Math.random() * 50) + 15,
    percentageIncrease: Math.floor(Math.random() * 100) + 25,
    endTime: new Date(Date.now() + getRandomEndTime(index)),
    badges: item.price > 5000 ? ["Ending", "Premium"] : ["Ending"]
  }));

  function getCategory(title) {
    if (title.includes('iPhone') || title.includes('Laptop')) return 'Electronics';
    if (title.includes('Rolex')) return 'Watches & Jewelry';
    if (title.includes('Backpack')) return 'Fashion & Accessories';
    return 'Collectibles';
  }

  function getLocation(index) {
    const locations = ['Los Angeles, CA', 'Beverly Hills, CA', 'London, UK', 'Seattle, WA'];
    return locations[index % locations.length];
  }

  function getRandomEndTime(index) {
    const baseTimes = [
      8 * 60 * 60 * 1000 + 45 * 60 * 1000, // 8h 45m
      18 * 60 * 60 * 1000 + 45 * 60 * 1000, // 18h 45m
      1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 22 * 60 * 1000, // 1d 14h 22m
      1 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000 + 40 * 60 * 1000  // 1d 22h 40m
    ];
    return baseTimes[index % baseTimes.length];
  }

  // Update countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = {};
      endingSoonItems.forEach(item => {
        const difference = item.endTime - new Date();
        if (difference > 0) {
          newTimeLeft[item.id] = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60)
          };
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (time) => {
    if (!time) return "00h 00m";
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h ${time.minutes}m`;
    }
    return `${time.hours}h ${time.minutes}m`;
  };

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
            <h2 className="text-3xl font-bold text-gray-900">Ending Soon</h2>
            <p className="text-gray-600 mt-2">Don't miss these last-chance opportunities</p>
          </div>
          <div className="text-orange-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Grid of auction items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {endingSoonItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              {/* Image and badges */}
              <div className="relative h-48 bg-gray-200">
                <div className="absolute top-3 left-3 flex gap-2">
                  {item.badges.map((badge, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        badge === 'Premium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
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

                {/* Current bid and bids info */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Current Bid</p>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900">{formatPrice(item.currentBid)}</span>
                      <span className="text-sm text-green-600 ml-2">+{item.percentageIncrease}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{item.totalBids} bids</span>
                    </div>
                  </div>
                </div>

                {/* Time remaining */}
                <div className="flex items-center text-orange-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{formatTime(timeLeft[item.id])}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EndingSoon;