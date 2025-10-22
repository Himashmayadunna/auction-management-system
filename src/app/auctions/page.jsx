"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auctionAPI } from "../../lib/auctionApi";
import AuctionCard from "../components/AuctionCard";

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
          <div className="flex flex-col items-center justify-center py-20 px-4">
            {/* Empty State Illustration */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-[#22304a] to-[#3a4a6a] rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {/* Decorative circles */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse delay-75"></div>
            </div>

            {/* Empty State Text */}
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Auctions Available</h3>
            <p className="text-gray-600 text-lg mb-2 max-w-md text-center">
              There are currently no active auctions to display.
            </p>
            <p className="text-gray-500 mb-8 max-w-md text-center">
              Check back soon for exciting deals on premium items, or be the first to create an auction!
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/sell"
                className="group bg-[#22304a] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a2538] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create First Auction
              </Link>
              
              <Link 
                href="/"
                className="bg-white text-[#22304a] border-2 border-[#22304a] px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Home
              </Link>
            </div>

            {/* Decorative elements */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl w-full">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Live Bidding</h4>
                <p className="text-sm text-gray-600">Real-time auction updates</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Secure</h4>
                <p className="text-sm text-gray-600">Safe transactions guaranteed</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Fast</h4>
                <p className="text-sm text-gray-600">Quick and easy bidding</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id || auction.auctionId} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionsPage;