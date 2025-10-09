"use client";

import React, { useState, useEffect } from "react";
import { Search, List, Grid } from "lucide-react";
import Link from "next/link";
import { auctionAPI, auctionUtils } from "../../lib/auctionApi";

const stats = [
  { label: "Live Now", value: 10 },
  { label: "Ending Soon", value: 5 },
  { label: "Featured", value: 7 },
];

const categories = [
  "All Categories",
  "Watches",
  "Art",
  "Electronics",
  "Jewelry",
  "Cars",
];

const sortOptions = [
  "Ending Soon",
  "Recently Added",
  "Price: Low to High",
  "Price: High to Low",
];

const AuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSort, setSelectedSort] = useState('Ending Soon');

  // Debug logging
  console.log('🎯 AuctionsPage render - auctions:', auctions.length, 'loading:', loading, 'error:', error);

  // Simplified test - just set test data immediately
  useEffect(() => {
    console.log('🚀 useEffect triggered - setting test data immediately');
    
    const testData = [
      {
        id: 1,
        title: "Test iPhone 14",
        description: "Test description",
        startingPrice: 1000,
        currentPrice: 1200,
        images: ["/iphone 14.jpg"],
        seller: "Test Seller",
        category: "Electronics",
        status: "Active"
      }
    ];
    
    setTimeout(() => {
      console.log('⏰ Setting test auctions after timeout');
      setAuctions(testData);
      setLoading(false);
      setError(null);
    }, 1000);
    
    return; // Skip the async function for now
    
    async function fetchAuctions() {
      try {
        console.log('🔧 Setting loading to true...');
        setLoading(true);
        console.log('🔧 Auctions page: Starting data fetch...');
        
        // Try to fetch from backend first, fall back to local data if it fails
        try {
          console.log('🌐 Attempting to fetch auctions from backend API...');
          const response = await auctionAPI.getAuctions();
          
          console.log('📦 Auctions page received response:', response);
          
          // Handle the response properly - should be an array after transformation
          if (Array.isArray(response) && response.length > 0) {
            setAuctions(response);
            console.log(`✅ Set ${response.length} auctions from backend`);
            setError(null);
          } else {
            console.log('⚠️ Backend returned empty array or invalid data, using fallback');
            throw new Error('No data from backend');
          }
          
        } catch (backendError) {
          console.log('❌ Backend unavailable, loading local test data:', backendError.message);
          
          // Fallback to test data
          const testAuctions = [
            {
              id: 1,
              title: "iPhone 14 Pro",
              description: "256GB, Deep Purple, excellent condition.",
              startingPrice: 1200,
              currentPrice: 1350,
              images: ["/iphone 14.jpg"],
              seller: "John Doe",
              category: "Electronics",
              condition: "Excellent",
              location: "Los Angeles, CA",
              bidCount: 15,
              timeRemaining: "2d 14h 30m",
              status: "Active",
              endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 2,
              title: "Rolex Submariner",
              description: "Original Rolex Submariner, mint condition.",
              startingPrice: 9500,
              currentPrice: 11200,
              images: ["/rolex.jpg"],
              seller: "Michael Brown",
              category: "Luxury",
              condition: "Mint",
              location: "Beverly Hills, CA",
              bidCount: 8,
              timeRemaining: "4d 8h 15m",
              status: "Active",
              endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 3,
              title: "ASUS ROG Gaming Laptop",
              description: "RTX 4070, 16GB RAM, 1TB SSD.",
              startingPrice: 1800,
              currentPrice: 2100,
              images: ["/rolex.jpg"], // Use available image
              seller: "Alice Smith",
              category: "Electronics",
              condition: "Excellent",
              location: "Seattle, WA",
              bidCount: 5,
              timeRemaining: "1d 12h 45m",
              status: "Active",
              endTime: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];
          
          setAuctions(testAuctions);
          setError(null);
          console.log(`✅ Set ${testAuctions.length} fallback auctions`);
          console.log('🔍 Fallback auctions data:', testAuctions);
        }
      } catch (err) {
        console.error('❌ Error in data setup:', err);
        setError('Unable to load auction data');
        setAuctions([]);
        
      } finally {
        setLoading(false);
        console.log('🏁 Auctions page fetch completed');
        console.log('🔍 Final state - auctions:', auctions.length, 'loading:', false, 'error:', error);
      }
    }

    console.log('🔧 Calling fetchAuctions...');
    fetchAuctions();
  }, [searchQuery, selectedCategory, selectedSort]);

  // Helper functions for display
  function getLocation(index) {
    const locations = ['Los Angeles, CA', 'Beverly Hills, CA', 'London, UK', 'Seattle, WA', 'New York, NY', 'Miami, FL'];
    return locations[index % locations.length];
  }

  function getTimeRemaining(index) {
    const times = ['8h 44m', '1d 14h 22m', '3d 22h 45m', '5d 10h 25m', '2d 6h 50m', '4d 18h 10m'];
    return times[index % times.length];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#22304a] pt-8 pb-16 px-4 md:px-0">
        <div className="max-w-7xl mx-auto py-5">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold text-white mb-2">Live Auctions</h1>
            <p className="text-lg text-gray-200 mb-6">
              Discover {loading ? '...' : auctions.length}+ unique items from verified sellers worldwide
            </p>
            <div className="flex gap-10 mb-2">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-gray-300">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters/Search */}
      <div className="max-w-7xl mx-auto mt-4 px-4 md:px-0 ">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center gap-4 ">
          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 ">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search auctions by title, description, or seller..."
              className="bg-transparent outline-none flex-1 text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700"
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
          >
            {sortOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="bg-gray-900 text-white rounded-lg p-2">
              <Grid className="w-5 h-5" />
            </button>
            <button className="bg-white border border-gray-200 text-gray-700 rounded-lg p-2">
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 font-medium text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" /></svg>
            Advanced Filters
          </button>
          <span className="text-gray-500">{loading ? '...' : auctions.length} items found</span>
        </div>
      </div>

      {/* Auction Items Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-0 mt-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="text-gray-600 text-lg">Loading auctions...</div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-600 text-lg">Error: {error}</div>
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-600 text-lg">No auctions found</div>
            <div className="text-gray-500 mt-2">Try adjusting your search or filters</div>
            <div className="text-xs text-gray-400 mt-4">
              Debug: Loading={loading.toString()}, Error={error || 'none'}, Auctions count={auctions.length}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded text-sm">
              Debug: Found {auctions.length} auctions to display
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {auctions.map((item, index) => {
              const timeRemaining = auctionUtils.getTimeRemaining(item.endTime);
              const currentBid = item.currentPrice || item.startingPrice;

            return (
              <Link key={item.id} href={`/auction/${item.id || item.auctionId}`}>
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer">
                {/* Image and badges */}
                <div className="relative h-48 bg-gray-200">
                  <div className="absolute top-3 left-3 flex gap-2 z-10">
                    {item.status === 'ending' && (
                      <span className="bg-orange-500 text-white px-2 py-1 text-xs font-medium rounded">
                        Ending
                      </span>
                    )}
                  </div>
                  
                  <img
                    src={item.images?.[0] || item.primaryImageUrl || '/rolex.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/rolex.jpg';
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Category and Location */}
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span>{item.category}</span>
                    {item.location && (
                      <>
                        <span className="mx-1">•</span>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{item.location}</span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>

                  {/* Seller info */}
                  <div className="flex items-center mb-3">
                    <span className="text-blue-600 text-sm font-medium">
                      {item.sellerName || 
                       (item.seller && typeof item.seller === 'object' ? 
                         `${item.seller.firstName} ${item.seller.lastName}` : 
                         item.seller) || 
                       'Anonymous'}
                    </span>
                    <div className="flex items-center ml-2">
                      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm text-gray-600 ml-1">4.8</span>
                    </div>
                  </div>

                  {/* Current Bid */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 mb-1">Current Bid</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">
                        ${(item.currentPrice || item.startingPrice || 0).toLocaleString()}
                      </span>
                      <span className={`text-sm font-medium ${item.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Bids and Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{item.bidCount || item.totalBids || 0} bid{(item.bidCount || item.totalBids || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center text-orange-600 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {item.timeRemaining || 
                         (item.endTime ? 
                           new Date(item.endTime) > new Date() ? 
                             `${Math.ceil((new Date(item.endTime) - new Date()) / (1000 * 60 * 60 * 24))} days left` : 
                             'Ended' 
                           : 'Active'
                         )
                        }
                      </span>
                    </div>
                  </div>
                </div>
                </div>
              </Link>
            );
          })}
          </div>
          </div>
        )}
        {/* Gap before footer */}
        <div className="h-18"></div>
      </div>
    </div>
  );
};

export default AuctionsPage;
