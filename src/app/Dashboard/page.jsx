'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getCurrentUser, isAuthenticated, clearAuthData } from '@/lib/api'
import { auctionAPI } from '@/lib/auctionApi'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userBids, setUserBids] = useState([])
  const [userAuctions, setUserAuctions] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [bidHistoryDetails, setBidHistoryDetails] = useState([])
  const [auctionStats, setAuctionStats] = useState({})
  const router = useRouter()

  // Helper function to calculate bid count from auction data with null safety
  const calculateBidCount = (auction) => {
    if (!auction) return 0;
    
    // If auction has a bidCount field, use it
    if (auction.bidCount !== undefined && auction.bidCount !== null) {
      return auction.bidCount;
    }
    
    // If auction has bids array, count them
    if (auction.bids && Array.isArray(auction.bids)) {
      return auction.bids.length;
    }
    
    // Calculate based on price difference (estimate) with null safety
    const currentPrice = auction.currentPrice || 0;
    const startingPrice = auction.startingPrice || 0;
    const priceDifference = currentPrice - startingPrice;
    
    if (priceDifference > 0) {
      // Estimate: roughly 1 bid per $50 increase (adjust as needed)
      return Math.max(1, Math.floor(priceDifference / 50));
    }
    
    // Default to 0 if no bids detected
    return 0;
  }

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      console.log('🚫 User not authenticated, redirecting to signin')
      router.push('/signin')
      return
    }

    // Get current user data
    const userData = getCurrentUser()
    console.log('👤 Dashboard - Retrieved user data:', userData)
    
    if (!userData) {
      console.error('❌ No user data found despite authentication, redirecting to signin')
      router.push('/signin')
      return
    }

    if (!userData.userId) {
      console.error('❌ User data missing userId field:', userData)
      alert('Authentication error: Missing user ID. Please sign in again.')
      router.push('/signin')
      return
    }

    setUser(userData)
    setLoading(false)
    
    // Fetch user's auction data
    fetchUserDashboardData(userData)
  }, [router])

  // Fetch user's bids, auctions, and watchlist
  const fetchUserDashboardData = async (currentUser = null) => {
    try {
      setDashboardLoading(true)
      
      // Use provided user data or fall back to state, with null checks
      const userData = currentUser || user
      if (!userData || !userData.userId) {
        console.error('❌ No valid user data available for dashboard')
        setDashboardLoading(false)
        return
      }
      
      console.log('📊 Dashboard: Fetching comprehensive auction data for user:', userData.userId)
      
      // Fetch all auctions and filter by user
      const allAuctions = await auctionAPI.getAuctions()
      console.log('📦 All auctions fetched:', allAuctions)
      
      // Filter auctions created by current user with null safety
      const userAuctionsData = allAuctions.filter(auction => {
        if (!auction) return false
        return auction.sellerId === userData.userId || 
               (auction.seller && auction.seller.userId === userData.userId)
      })
      
      // Debug: Log auction data structure to see available fields
      console.log('🔍 Sample auction data structure:', allAuctions[0])
      console.log('🔍 Bid count fields found:', allAuctions.map(a => ({
        id: a.id,
        title: a.title,
        bidCount: a.bidCount,
        bids: a.bids,
        currentPrice: a.currentPrice,
        startingPrice: a.startingPrice
      })))
      
      // Fetch user's bidding history using the new API
      let userBidsData = []
      try {
        console.log('🔄 Fetching user bid history from API...')
        const bidHistory = await auctionAPI.getUserBids()
        console.log('📦 Raw bid history response:', bidHistory)
        
        // Ensure we have an array
        const bidHistoryArray = Array.isArray(bidHistory) ? bidHistory : (bidHistory?.data ? bidHistory.data : [])
        setBidHistoryDetails(bidHistoryArray)
        userBidsData = bidHistoryArray
        console.log('✅ User bid history processed:', userBidsData.length, 'bids')
      } catch (bidError) {
        console.log('⚠️ Could not fetch user bid history:', bidError.message)
        // Fallback to simulated data
        userBidsData = allAuctions.filter((auction, index) => 
          // Simulate user having bid on some auctions (for demo)
          auction && index % 3 === 0 && auction.sellerId !== userData.userId
        ).map(auction => ({
          id: `bid_${auction.id}`,
          auctionId: auction.id,
          auction: auction,
          bidAmount: (auction.currentPrice || auction.startingPrice || 0) + 50, // Simulate bid amount
          bidTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          isWinning: Math.random() > 0.5, // Simulate winning status
          status: auction.status === 'Active' ? 'active' : 'ended'
        }))
        console.log('📝 Using simulated bid data:', userBidsData.length, 'bids')
      }
      
      // Ensure userBidsData is always an array before using array methods
      const safeUserBidsData = Array.isArray(userBidsData) ? userBidsData : []
      
      // Simulate watchlist (auctions user is watching but hasn't bid on)
      const watchlistData = allAuctions.filter((auction, index) => 
        auction && index % 4 === 0 && 
        auction.sellerId !== userData.userId &&
        !safeUserBidsData.some(bid => bid.auctionId === auction.id)
      ).map(auction => ({
        id: `watch_${auction.id}`,
        auction: auction,
        addedDate: new Date(Date.now() - Math.random() * 172800000).toISOString()
      }))
      
      setUserBids(safeUserBidsData)
      setWatchlist(watchlistData)
      setUserAuctions(userAuctionsData)
      
      console.log('✅ Dashboard data loaded:', {
        userAuctions: userAuctionsData?.length || 0,
        activeBids: safeUserBidsData?.length || 0,
        watchlist: watchlistData?.length || 0,
        userBidsDataType: typeof safeUserBidsData,
        isUserBidsArray: Array.isArray(safeUserBidsData)
      })
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      // Set empty arrays on error to ensure UI doesn't break
      setUserBids([])
      setWatchlist([])
      setUserAuctions([])
      setBidHistoryDetails([])
      setAuctionStats({})
    } finally {
      setDashboardLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthData()
    router.push('/signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-700"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-slate-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-700 font-bold text-xl">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {user.firstName}!</h1>
                <p className="text-slate-300">Manage your auctions and bids</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your items..."
                  className="px-4 py-2 rounded-lg text-gray-900 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-13z" />
                </svg>
                Notifications
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex space-x-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bidding')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bidding'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Bids ({Array.isArray(userBids) ? userBids.length : 0})
          </button>
          <button
            onClick={() => setActiveTab('selling')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'selling'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Auctions ({Array.isArray(userAuctions) ? userAuctions.length : 0})
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'watchlist'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Watchlist ({Array.isArray(watchlist) ? watchlist.length : 0})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {dashboardLoading ? '...' : (Array.isArray(userBids) ? userBids.length : 0)}
            </div>
            <div className="text-sm text-gray-500">Active Bids</div>
            <div className="text-xs text-gray-400 mt-1">
              Total bids on your auctions: {dashboardLoading ? '...' : (Array.isArray(userAuctions) ? userAuctions.reduce((sum, auction) => sum + calculateBidCount(auction), 0) : 0)}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {dashboardLoading ? '...' : userAuctions.length}
            </div>
            <div className="text-sm text-gray-500">Your Auctions</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {dashboardLoading ? '...' : watchlist.length}
            </div>
            <div className="text-sm text-gray-500">Watchlist</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${dashboardLoading ? '...' : userBids.reduce((sum, bid) => sum + (bid.isWinning ? bid.bidAmount : 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Winning Bids Value</div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Your Auctions */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Auctions</h2>
              <button 
                onClick={() => router.push('/sell')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create New
              </button>
            </div>
            
            {dashboardLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading your auctions...</p>
              </div>
            ) : userAuctions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions yet</h3>
                <p className="text-gray-500 mb-4">Start selling by creating your first auction</p>
                <button 
                  onClick={() => router.push('/sell')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Auction
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userAuctions.map((auction) => (
                  <div key={auction.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <img
                          src={auction.images?.[0] || '/rolex.jpg'}
                          alt={auction?.title || 'Auction item'}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=📷`;
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{auction?.title || 'Untitled Auction'}</h3>
                          <p className="text-sm text-gray-600 mb-2">{auction.category}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Starting: ${auction?.startingPrice || 0}</span>
                            <span>Current: ${auction?.currentPrice || 0}</span>
                            <span>Bids: {auction.bidCount || auction.bids?.length || calculateBidCount(auction)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          auction.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {auction.status}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          {auction.endTime ? new Date(auction.endTime).toLocaleDateString() : 'No end date'}
                        </div>
                        {calculateBidCount(auction) > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            💰 {calculateBidCount(auction)} bid{calculateBidCount(auction) !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {userBids.length > 0 ? (
                userBids.slice(0, 3).map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${bid.isWinning ? 'bg-green-50' : 'bg-blue-50'}`}>
                        <svg className={`w-5 h-5 ${bid.isWinning ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {bid.isWinning ? 'Winning bid' : 'Bid placed'}
                        </div>
                        <div className="text-xs text-blue-600">{bid.auction?.title || 'Untitled Auction'} - ${bid.bidAmount}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(bid.bidTime).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <p className="text-sm text-gray-500">No recent bids</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Bids Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Active Bids</h2>
            <button 
              onClick={() => router.push('/auctions')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse Auctions
            </button>
          </div>
          
          {dashboardLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading your bids...</p>
            </div>
          ) : userBids.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active bids</h3>
              <p className="text-gray-500 mb-4">Start bidding on auctions that interest you</p>
              <button 
                onClick={() => router.push('/auctions')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Browse Auctions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBids.map((bid) => (
                <div key={bid.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <img
                    src={bid.auction?.images?.[0] || '/rolex.jpg'}
                    alt={bid.auction?.title || 'Auction item'}
                    className="w-full h-32 rounded-lg object-cover mb-3"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/300x128/f3f4f6/9ca3af?text=📷`;
                    }}
                  />
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{bid.auction?.title || 'Untitled Auction'}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your bid:</span>
                      <span className="font-semibold">${bid.bidAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current price:</span>
                      <span>${bid.auction?.currentPrice || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bid.isWinning ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {bid.isWinning ? 'Winning' : 'Outbid'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Watchlist Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Watchlist</h2>
            <span className="text-sm text-gray-500">{watchlist.length} items</span>
          </div>
          
          {dashboardLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading watchlist...</p>
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items in watchlist</h3>
              <p className="text-gray-500">Add auctions to your watchlist to track them</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {watchlist.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <img
                    src={item.auction?.images?.[0] || '/rolex.jpg'}
                    alt={item.auction?.title || 'Auction item'}
                    className="w-full h-24 rounded-lg object-cover mb-2"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/200x96/f3f4f6/9ca3af?text=📷`;
                    }}
                  />
                  <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{item.auction?.title || 'Untitled Auction'}</h4>
                  <div className="text-xs text-gray-500">
                    Current: ${item.auction?.currentPrice || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {/* Bidding Tab */}
        {activeTab === 'bidding' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">My Bidding History</h2>
              {dashboardLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (Array.isArray(userBids) && userBids.length > 0) ? (
                <div className="space-y-4">
                  {userBids.map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={bid.auction?.images?.[0] || '/rolex.jpg'}
                          alt={bid.auction?.title || 'Auction item'}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{bid.auction?.title || 'Untitled Auction'}</h3>
                          <p className="text-sm text-gray-500">Bid: ${bid.bidAmount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">
                            {bid.bidTime ? new Date(bid.bidTime).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          bid.isWinning ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bid.isWinning ? 'Winning' : 'Outbid'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          bid.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bid.status === 'active' ? 'Active' : 'Ended'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <p>No bids placed yet</p>
                  <p className="text-sm">Start bidding on auctions to see your history here!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selling Tab */}
        {activeTab === 'selling' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">My Auctions</h2>
                <button
                  onClick={() => router.push('/sell')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Auction
                </button>
              </div>
              {dashboardLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (Array.isArray(userAuctions) && userAuctions.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userAuctions.map((auction) => (
                    <div key={auction.id} className="border border-gray-200 rounded-lg p-4">
                      <img
                        src={auction?.images?.[0] || '/rolex.jpg'}
                        alt={auction?.title || 'Auction item'}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-medium text-gray-900 mb-2">{auction?.title || 'Untitled Auction'}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current Price:</span>
                          <span className="font-medium">${(auction?.currentPrice || auction?.startingPrice || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Bids:</span>
                          <span className="font-medium">{calculateBidCount(auction)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className={`font-medium ${
                            auction.status === 'Active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {auction.status || 'Active'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/auction/${auction.id}`)}
                        className="w-full mt-3 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p>No auctions created yet</p>
                  <p className="text-sm">Create your first auction to start selling!</p>
                  <button
                    onClick={() => router.push('/sell')}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Auction
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">My Watchlist</h2>
              {dashboardLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (Array.isArray(watchlist) && watchlist.length > 0) ? (
                <div className="space-y-4">
                  {watchlist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.auction?.images?.[0] || '/rolex.jpg'}
                          alt={item.auction?.title || 'Auction item'}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{item.auction?.title || 'Untitled Auction'}</h3>
                          <p className="text-sm text-gray-500">
                            Current: ${(item.auction?.currentPrice || item.auction?.startingPrice).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            Added: {item.addedDate ? new Date(item.addedDate).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => router.push(`/auction/${item.auction.id}`)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View
                        </button>
                        <button className="bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p>No items in watchlist</p>
                  <p className="text-sm">Add interesting auctions to your watchlist!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile Details</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="space-y-6">
                  <div className="text-center md:text-left">
                    <div className="w-24 h-24 rounded-full bg-slate-700 text-white text-3xl font-bold flex items-center justify-center mx-auto md:mx-0 mb-4">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-gray-500">{user?.email}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        user?.accountType === 'Seller' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user?.accountType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{user?.firstName || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{user?.lastName || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{user?.email || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{user?.accountType || 'Not specified'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-mono text-sm">{user?.userId || 'Not available'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                        {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900">Activity Summary</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Array.isArray(userBids) ? userBids.length : 0}
                      </div>
                      <div className="text-sm text-blue-800">Total Bids</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Array.isArray(userAuctions) ? userAuctions.length : 0}
                      </div>
                      <div className="text-sm text-green-800">My Auctions</div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Array.isArray(watchlist) ? watchlist.length : 0}
                      </div>
                      <div className="text-sm text-purple-800">Watchlist Items</div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Array.isArray(userBids) ? userBids.filter(bid => bid.isWinning).length : 0}
                      </div>
                      <div className="text-sm text-orange-800">Winning Bids</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {Array.isArray(userAuctions) ? userAuctions.filter(auction => auction.status === 'Active').length : 0}
                      </div>
                      <div className="text-sm text-red-800">Active Auctions</div>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        $0
                      </div>
                      <div className="text-sm text-indigo-800">Total Spent</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Account Actions</h5>
                    <div className="space-y-2">
                      <button className="w-full p-3 text-left bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit Profile Information</span>
                        </div>
                      </button>
                      
                      <button className="w-full p-3 text-left bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Change Password</span>
                        </div>
                      </button>
                      
                      <button className="w-full p-3 text-left bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Account Settings</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}