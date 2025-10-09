"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auctionAPI } from "../../lib/auctionApi";

const AuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🎯 Component render - auctions:', auctions.length, 'loading:', loading);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        console.log('🚀 Auctions page: Fetching from backend API');
        setLoading(true);
        
        const response = await auctionAPI.getAuctions();
        console.log('✅ Auctions page: Received backend data:', response);
        
        const auctionData = response.data || response || [];
        
        if (Array.isArray(auctionData)) {
          // Transform backend data to ensure all fields are properly formatted
          const transformedAuctions = auctionData.map(auction => ({
            ...auction,
            images: Array.isArray(auction.images) ? auction.images : 
                   (auction.images ? [auction.images] : ['/rolex.jpg']),
            seller: typeof auction.seller === 'object' && auction.seller ? 
                   `${auction.seller.firstName || ''} ${auction.seller.lastName || ''}`.trim() || 'Anonymous' : 
                   (auction.seller || 'Anonymous'),
            currentPrice: auction.currentPrice || auction.startingPrice || 0
          }));
          
          setAuctions(transformedAuctions);
          console.log(`📦 Auctions page: Loaded ${transformedAuctions.length} auctions from database`);
        } else {
          console.log('⚠️ Invalid response format from backend');
          setAuctions([]);
        }
      } catch (error) {
        console.error('❌ Auctions page: Failed to fetch from backend:', error);
        setError(error.message);
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading Auctions...</div>
          <div className="text-sm text-gray-500">Please wait while we fetch the latest auctions</div>
        </div>
      </div>
    );
  }

  if (error) {
    const isDatabaseError = error.includes('SQL Server') || error.includes('database');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              {isDatabaseError ? 'Database Connection Error' : 'Failed to Load Auctions'}
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            
            {isDatabaseError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 text-left">
                <h4 className="font-medium text-yellow-800 mb-2">🔧 Quick Fix Steps:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Ensure SQL Server is running</li>
                  <li>2. Check backend database connection</li>
                  <li>3. Run database migrations</li>
                  <li>4. See DATABASE_TROUBLESHOOTING.md</li>
                </ol>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#22304a] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Live Auctions</h1>
          <p className="text-gray-300 text-lg">Discover amazing deals on premium items</p>
        </div>
      </div>

      {/* Auctions Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Auctions ({auctions.length})</h2>
          <p className="text-gray-600">Click on any item to view details and place bids</p>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No auctions available</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {auctions.map((auction) => (
              <Link key={auction.id} href={`/auction/${auction.id}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  {/* Image */}
                  <div className="h-48 bg-gray-200">
                    <img
                      src={Array.isArray(auction.images) && auction.images.length > 0 ? 
                        auction.images[0] : 
                        (auction.images || '/rolex.jpg')}
                      alt={auction.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/rolex.jpg'; // Fallback image
                      }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {auction.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {auction.description}
                    </p>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Current Bid</p>
                        <p className="text-lg font-bold text-green-600">
                          ${auction.currentPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm font-medium text-gray-700">
                          {auction.category}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Seller: {typeof auction.seller === 'object' && auction.seller ? 
                        `${auction.seller.firstName || ''} ${auction.seller.lastName || ''}`.trim() || 'Anonymous' : 
                        (auction.seller || 'Anonymous')}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionsPage;