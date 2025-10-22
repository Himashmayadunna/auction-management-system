'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auctionAPI } from '../../../lib/auctionApi'
import { isAuthenticated, getCurrentUser } from '../../../lib/api'
import ImageGallery from '../../components/ImageGallery'
import { getAuctionImages } from '../../../services/imageService'

export default function AuctionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [auction, setAuction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [placingBid, setPlacingBid] = useState(false)
  const [user, setUser] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [bidHistory, setBidHistory] = useState([])
  const [bidStats, setBidStats] = useState(null)
  const [loadingBids, setLoadingBids] = useState(false)
  const [auctionImages, setAuctionImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getCurrentUser())
    }
    fetchAuctionDetails()
  }, [params.id])

  useEffect(() => {
    // Update time remaining every second
    const timer = setInterval(() => {
      if (auction?.endTime) {
        const remaining = calculateTimeRemaining(auction.endTime)
        setTimeRemaining(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [auction])

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true)
      console.log('📦 Fetching auction details for ID:', params.id)
      
      // Get all auctions and find the specific one
      const allAuctions = await auctionAPI.getAuctions()
      const auctionDetails = allAuctions.find(a => a.id == params.id || a.auctionId == params.id)
      
      if (!auctionDetails) {
        throw new Error('Auction not found')
      }

      console.log('✅ Auction details loaded:', auctionDetails)
      console.log('📝 Description field:', auctionDetails.description)
      console.log('📋 All auction fields:', Object.keys(auctionDetails))
      setAuction(auctionDetails)
      
      // Set initial bid amount to minimum increment above current price
      const minBid = (auctionDetails.currentPrice || auctionDetails.startingPrice) + 10
      setBidAmount(minBid.toString())
      
      // Fetch auction images
      await fetchAuctionImages(auctionDetails.id || auctionDetails.auctionId)
      
      // Fetch bidding data
      await fetchBiddingData(auctionDetails.id)
      
    } catch (error) {
      console.error('❌ Error fetching auction details:', error)
      alert('Failed to load auction details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAuctionImages = async (auctionId) => {
    try {
      setLoadingImages(true)
      console.log('🖼️ Fetching auction images for auction:', auctionId)
      
      const images = await getAuctionImages(auctionId)
      console.log('✅ Auction images loaded:', images)
      setAuctionImages(images || [])
    } catch (error) {
      console.error('❌ Error fetching auction images:', error)
      setAuctionImages([])
    } finally {
      setLoadingImages(false)
    }
  }

  const fetchBiddingData = async (auctionId) => {
    try {
      setLoadingBids(true)
      console.log('📊 Fetching bidding data for auction:', auctionId)

      // Fetch bid history and statistics
      const [bidsResponse, statsResponse, highestBidResponse] = await Promise.allSettled([
        auctionAPI.getAuctionBids(auctionId),
        auctionAPI.getBidStats(auctionId),
        auctionAPI.getHighestBid(auctionId)
      ])

      // Handle bid history
      if (bidsResponse.status === 'fulfilled') {
        setBidHistory(bidsResponse.value || [])
        console.log('✅ Bid history loaded:', bidsResponse.value)
      } else {
        console.log('⚠️ Could not fetch bid history:', bidsResponse.reason)
        setBidHistory([])
      }

      // Handle bid statistics
      if (statsResponse.status === 'fulfilled') {
        setBidStats(statsResponse.value)
        console.log('✅ Bid statistics loaded:', statsResponse.value)
      } else {
        console.log('⚠️ Could not fetch bid statistics:', statsResponse.reason)
        setBidStats(null)
      }

      // Handle highest bid (update current price if available)
      if (highestBidResponse.status === 'fulfilled' && highestBidResponse.value?.amount) {
        setAuction(prev => ({
          ...prev,
          currentPrice: highestBidResponse.value.amount
        }))
        console.log('✅ Current price updated from highest bid:', highestBidResponse.value.amount)
      }

    } catch (error) {
      console.error('❌ Error fetching bidding data:', error)
    } finally {
      setLoadingBids(false)
    }
  }

  const calculateTimeRemaining = (endTime) => {
    if (!endTime) return 'Time not set';
    
    try {
      const now = new Date();
      // Handle different date formats from backend
      const end = new Date(endTime);
      
      // Check if date is valid
      if (isNaN(end.getTime())) {
        console.error('Invalid endTime format:', endTime);
        return 'Invalid date';
      }
      
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        return 'Auction Ended';
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else {
        return `${minutes}m ${seconds}s`;
      }
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 'Time calculation error';
    }
  }

  const handlePlaceBid = async () => {
    if (!isAuthenticated()) {
      alert('Please sign in to place a bid')
      router.push('/signin')
      return
    }

    // Check if user is the seller (prevent sellers from bidding on their own auctions)
    if (user && (user.userId === auction.sellerId || user.userId === auction.seller?.userId)) {
      alert('❌ Sellers cannot bid on their own auctions!')
      return
    }

    const bidValue = parseFloat(bidAmount)
    const currentPrice = auction.currentPrice || auction.startingPrice

    if (bidValue <= currentPrice) {
      alert(`Bid must be higher than current price of $${currentPrice}`)
      return
    }

    try {
      setPlacingBid(true)
      console.log('💰 Placing bid:', { auctionId: auction.id, bidAmount: bidValue })

      // Place bid using real API
      const bidResponse = await auctionAPI.placeBid(auction.id, bidValue)
      console.log('✅ Bid placement response:', bidResponse)

      // Refresh bidding data to get updated information
      await fetchBiddingData(auction.id)
      
      alert('Bid placed successfully!')
      setBidAmount((bidValue + 10).toString()) // Set next minimum bid

    } catch (error) {
      console.error('❌ Error placing bid:', error)
      const errorMessage = error.message || 'Failed to place bid. Please try again.'
      alert(errorMessage)
    } finally {
      setPlacingBid(false)
    }
  }

  const handleImageNavigation = (direction) => {
    const images = auction?.images || []
    if (images.length <= 1) return

    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auction details...</p>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h1>
          <p className="text-gray-600 mb-6">The auction you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => router.push('/auctions')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse All Auctions
          </button>
        </div>
      </div>
    )
  }

  const images = auction.images || []
  const isAuctionEnded = timeRemaining === 'Auction Ended'
  const isOwner = user && (user.userId === auction.sellerId || user.userId === auction.seller?.userId)

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Clean Header with Back Button */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="group flex items-center text-gray-600 hover:text-[#22304a] transition-all duration-300 mb-4"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#22304a] group-hover:text-white transition-all mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Back to Auctions</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image + Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
              {loadingImages ? (
                <div className="w-full h-[500px] bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22304a] mx-auto mb-4"></div>
                    <div className="text-gray-500 font-medium">Loading images...</div>
                  </div>
                </div>
              ) : auctionImages && auctionImages.length > 0 ? (
                <div className="p-6">
                  <ImageGallery images={auctionImages} />
                </div>
              ) : (
                <div className="w-full h-[500px] bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description Section - Under Image */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-[#22304a] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#22304a]">Item Description</h2>
              </div>
              
              {(() => {
                // Handle both camelCase and PascalCase from backend
                const desc = auction.description || auction.Description;
                console.log('🔍 Rendering description:', desc ? `Length: ${desc.length}` : 'No description');
                
                return desc && desc.trim() ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                      {desc}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No description provided by the seller</p>
                    <p className="text-gray-400 text-sm mt-1">Check back later for more details</p>
                    <p className="text-xs text-gray-400 mt-2 font-mono">Debug: {JSON.stringify({
                      hasDescription: !!auction.description,
                      hasDescriptionPascal: !!auction.Description,
                      auctionKeys: auction ? Object.keys(auction).filter(k => k.toLowerCase().includes('desc')) : []
                    })}</p>
                  </div>
                );
              })()}
              
              {/* Additional Item Details */}
              {(auction.condition || auction.category) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Item Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {auction.category && (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500">Category</p>
                          <p className="font-semibold text-gray-900">{auction.category}</p>
                        </div>
                      </div>
                    )}
                    {auction.condition && (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500">Condition</p>
                          <p className="font-semibold text-gray-900">{auction.condition}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Auction Details & Bidding */}
          <div className="lg:col-span-1 space-y-6">
            {/* Title and Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-[#22304a] mb-2 leading-tight">{auction.title}</h1>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                      isAuctionEnded 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        isAuctionEnded ? 'bg-red-200' : 'bg-green-200 animate-pulse'
                      }`}></span>
                      {isAuctionEnded ? 'Ended' : 'Live'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">Category</span>
                  </div>
                  <span className="font-semibold text-gray-900">{auction.category}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">Condition</span>
                  </div>
                  <span className="font-semibold text-gray-900">{auction.condition || 'Not specified'}</span>
                </div>

                {auction.location && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-gray-600 font-medium">Location</span>
                    </div>
                    <span className="font-semibold text-gray-900">{auction.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Clean White Bidding Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#22304a]">Current Auction</h2>
                <svg className="w-6 h-6 text-[#22304a]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Current Price - Large Display */}
              <div className="mb-6 text-center py-6 bg-gradient-to-br from-[#22304a] to-[#1a2436] rounded-xl">
                <p className="text-sm text-gray-300 mb-2">Current Bid</p>
                <p className="text-4xl font-black text-yellow-400 mb-1">
                  ${(auction.currentPrice || auction.startingPrice).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  Started at ${auction.startingPrice.toLocaleString()}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-[#22304a] mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="text-sm text-gray-600 font-medium">Total Bids</p>
                  </div>
                  <p className="text-2xl font-bold text-[#22304a]">{auction.bidCount || 0}</p>
                </div>
                
                <div className={`rounded-xl p-4 text-center border ${
                  isAuctionEnded ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-center mb-2">
                    <svg className={`w-5 h-5 mr-1 ${isAuctionEnded ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className={`text-sm font-medium ${isAuctionEnded ? 'text-red-600' : 'text-green-600'}`}>Time Left</p>
                  </div>
                  <p className={`text-lg font-bold ${isAuctionEnded ? 'text-red-600' : 'text-green-600'}`}>
                    {timeRemaining}
                  </p>
                </div>
              </div>

              {/* Clean Bidding Form - Only for Buyers */}
              {!isAuctionEnded && !isOwner && user && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 text-[#22304a] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="font-bold text-lg text-[#22304a]">Place Your Bid</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22304a] font-bold text-lg">$</span>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          min={(auction.currentPrice || auction.startingPrice) + 1}
                          step="1"
                          className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl text-[#22304a] text-lg font-bold placeholder-gray-400 focus:border-[#22304a] focus:outline-none transition-all"
                          placeholder="Enter your bid"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Minimum bid: ${((auction.currentPrice || auction.startingPrice) + 10).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handlePlaceBid}
                      disabled={placingBid || !bidAmount || parseFloat(bidAmount) <= (auction.currentPrice || auction.startingPrice)}
                      className="w-full py-4 bg-[#22304a] text-white font-bold rounded-xl hover:bg-[#1a2436] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg disabled:hover:scale-100"
                    >
                      {placingBid ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Placing Bid...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Place Bid Now
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {isOwner && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-blue-900 font-bold">Seller Dashboard</p>
                    </div>
                    <p className="text-blue-700 text-sm">You are the seller. Monitor your auction performance here.</p>
                  </div>
                  
                  {/* Quick Auction Stats for Seller */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <p className="text-sm text-green-700 font-medium mb-1">Current Bid</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${(auction.currentPrice || auction.startingPrice).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                      <p className="text-sm text-purple-700 font-medium mb-1">Total Bids</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {auction.bidCount || bidHistory.length || 0}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push('/Dashboard')}
                    className="w-full mt-4 bg-[#22304a] text-white py-3 rounded-xl hover:bg-[#1a2436] font-bold transition-all transform hover:scale-105 shadow-lg"
                  >
                    View Full Dashboard →
                  </button>
                </div>
              )}

              {!user && !isAuctionEnded && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-blue-900 mb-3 flex items-center font-medium">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Sign in to place your bid
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/signin')}
                    className="w-full bg-[#22304a] text-white py-3 rounded-xl hover:bg-[#1a2436] font-bold transition-all transform hover:scale-105 shadow-lg"
                  >
                    Sign In to Bid →
                  </button>
                </div>
              )}
            </div>

            {/* Clean Seller Information Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#22304a]">Seller Information</h2>
                <svg className="w-5 h-5 text-[#22304a]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-14 h-14 bg-[#22304a] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-xl font-bold text-white">
                    {auction.seller?.firstName?.[0] || 'S'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    {auction.seller?.firstName} {auction.seller?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified Seller
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bidding History and Statistics */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bidding History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-[#22304a] mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Bidding History
            </h2>
            {loadingBids ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : bidHistory.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bidHistory.slice(0, 10).map((bid, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        ${bid.amount?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {bid.bidder?.firstName || 'Anonymous'} {bid.bidder?.lastName || ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {bid.bidTime ? new Date(bid.bidTime).toLocaleString() : 'Unknown time'}
                      </p>
                      {index === 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Highest
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p>No bids yet</p>
                <p className="text-sm">Be the first to place a bid!</p>
              </div>
            )}
          </div>

          {/* Bid Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Auction Statistics</h2>
            {loadingBids ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : bidStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {bidStats.totalBids || bidHistory.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Bids</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {bidStats.uniqueBidders || 0}
                  </p>
                  <p className="text-sm text-gray-600">Bidders</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    ${bidStats.averageBid?.toLocaleString() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Average Bid</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    ${bidStats.highestBid?.toLocaleString() || auction.currentPrice?.toLocaleString() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Highest Bid</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No statistics available</p>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {auction.description || 'No description provided.'}
            </p>
          </div>

          {auction.tags && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {auction.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}