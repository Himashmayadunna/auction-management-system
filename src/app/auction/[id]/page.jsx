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
    const now = new Date()
    const end = new Date(endTime)
    const diff = end - now

    if (diff <= 0) {
      return 'Auction Ended'
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else {
      return `${minutes}m ${seconds}s`
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Auctions
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {loadingImages ? (
              <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                <div className="text-gray-500">Loading images...</div>
              </div>
            ) : auctionImages && auctionImages.length > 0 ? (
              <ImageGallery images={auctionImages} />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-32 h-32 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">No images available</p>
                </div>
              </div>
            )}
          </div>

          {/* Auction Details */}
          <div className="space-y-6">
            {/* Title and Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{auction.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isAuctionEnded ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isAuctionEnded ? 'Ended' : 'Active'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{auction.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Condition</p>
                  <p className="font-medium">{auction.condition || 'Not specified'}</p>
                </div>
              </div>

              {auction.location && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{auction.location}</p>
                </div>
              )}
            </div>

            {/* Bidding Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Current Bid</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Current Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(auction.currentPrice || auction.startingPrice).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Starting Price</p>
                  <p className="text-lg font-medium">${auction.startingPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Total Bids</p>
                  <p className="font-medium">{auction.bidCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Remaining</p>
                  <p className={`font-medium ${isAuctionEnded ? 'text-red-600' : 'text-blue-600'}`}>
                    {timeRemaining}
                  </p>
                </div>
              </div>

              {/* Bidding Form - Only for Buyers */}
              {!isAuctionEnded && !isOwner && user && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Place Your Bid</h3>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={(auction.currentPrice || auction.startingPrice) + 1}
                        step="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter bid amount"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum bid: ${((auction.currentPrice || auction.startingPrice) + 1).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handlePlaceBid}
                      disabled={placingBid || !bidAmount || parseFloat(bidAmount) <= (auction.currentPrice || auction.startingPrice)}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {placingBid ? 'Placing...' : 'Place Bid'}
                    </button>
                  </div>
                </div>
              )}

              {isOwner && (
                <div className="border-t pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-blue-800 font-medium">Seller Dashboard</p>
                    </div>
                    <p className="text-blue-700 text-sm">You are the seller of this auction. You cannot place bids on your own items.</p>
                  </div>
                  
                  {/* Quick Auction Stats for Seller */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Current Bid</p>
                      <p className="text-lg font-bold text-green-800">
                        ${(auction.currentPrice || auction.startingPrice).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Total Bids</p>
                      <p className="text-lg font-bold text-purple-800">
                        {auction.bidCount || bidHistory.length || 0}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push('/Dashboard')}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Full Dashboard
                  </button>
                </div>
              )}

              {!user && !isAuctionEnded && (
                <div className="border-t pt-6">
                  <p className="text-gray-600 mb-3">Please sign in to place a bid</p>
                  <button
                    onClick={() => router.push('/signin')}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Sign In to Bid
                  </button>
                </div>
              )}
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {auction.seller?.firstName?.[0] || 'S'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {auction.seller?.firstName} {auction.seller?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">Seller</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bidding History and Statistics */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bidding History */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Bidding History</h2>
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