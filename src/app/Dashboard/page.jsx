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

  // Helper function to check if auction has ended
  const isAuctionEnded = (auction) => {
    if (!auction || !auction.endTime) return false;
    const endTime = new Date(auction.endTime);
    const now = new Date();
    return now > endTime;
  }

  // Helper function to get auction status (considering time)
  const getAuctionStatus = (auction) => {
    if (!auction) return 'Unknown';
    
    // If already marked as Closed or Ended, return that status
    if (auction.status === 'Closed' || auction.status === 'Ended') {
      return auction.status;
    }
    
    // Check if time has expired
    if (isAuctionEnded(auction)) {
      return 'Ended';
    }
    
    return auction.status || 'Active';
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
      // Double-check authentication before making any API calls
      if (!isAuthenticated()) {
        console.log('🚫 Not authenticated, cannot fetch dashboard data')
        router.push('/signin')
        return
      }
      
      setDashboardLoading(true)
      
      // Use provided user data or fall back to state, with null checks
      const userData = currentUser || user
      if (!userData || !userData.userId) {
        console.error('❌ No valid user data available for dashboard')
        setDashboardLoading(false)
        router.push('/signin')
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
        // Check if user is still authenticated before making API call
        const token = localStorage.getItem('authToken')
        if (!isAuthenticated() || !token) {
          console.log('⚠️ User not authenticated, skipping bid history fetch')
          console.log('   Token exists:', !!token)
          console.log('   isAuthenticated():', isAuthenticated())
          userBidsData = []
        } else {
          console.log('🔄 Fetching user bid history from API...')
          console.log('   Using token:', token.substring(0, 20) + '...')
          const bidHistory = await auctionAPI.getUserBids()
          console.log('📦 Raw bid history response:', bidHistory)
          
          // Ensure we have an array
          const bidHistoryArray = Array.isArray(bidHistory) ? bidHistory : (bidHistory?.data ? bidHistory.data : [])
          setBidHistoryDetails(bidHistoryArray)
          userBidsData = bidHistoryArray
          console.log('✅ User bid history processed:', userBidsData.length, 'bids')
        }
      } catch (bidError) {
        // Check if it's an authentication error (401 or token expired)
        if (bidError.message?.includes('Authentication Required') || 
            bidError.message?.includes('401') ||
            bidError.message?.includes('Unauthorized')) {
          console.warn('⚠️ Authentication error - token may be expired. Clearing auth data.')
          // Clear invalid auth data
          clearAuthData()
          // Redirect to signin page
          router.push('/signin')
          return
        }
        
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

  // Delete auction handler
  const handleDeleteAuction = async (auctionOrId, auctionTitle = null) => {
    // Handle both object and ID passed as first parameter
    let auctionId, title;
    
    if (typeof auctionOrId === 'object' && auctionOrId !== null) {
      // If an auction object is passed
      auctionId = auctionOrId.id;
      title = auctionOrId.title || 'this auction';
    } else {
      // If just the ID is passed
      auctionId = auctionOrId;
      title = auctionTitle || 'this auction';
    }
    
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`
    )
    
    if (!confirmDelete) {
      return
    }

    try {
      console.log(`🗑️ Deleting auction: ${auctionId}`)
      
      // Call delete API
      await auctionAPI.deleteAuction(auctionId)
      
      console.log(`✅ Auction deleted successfully: ${auctionId}`)
      
      // Remove from local state
      setUserAuctions(prevAuctions => 
        prevAuctions.filter(auction => auction.id !== auctionId)
      )
      
      // Show success message
      alert('Auction deleted successfully!')
      
      // Optionally refresh dashboard data
      if (user) {
        fetchUserDashboardData(user)
      }
      
    } catch (error) {
      console.error('❌ Error deleting auction:', error)
      alert(`Failed to delete auction: ${error.message || 'Unknown error'}`)
    }
  }

  // Close/Complete auction handler (seller confirms winner)
  const handleCloseAuction = async (auction) => {
    const bidCount = calculateBidCount(auction)
    
    // Check if there are any bids
    if (bidCount === 0) {
      const confirmClose = window.confirm(
        `Close "${auction.title}" with no bids?\n\nThis will end the auction without a winner.`
      )
      if (!confirmClose) return
    } else {
      const confirmClose = window.confirm(
        `Close "${auction.title}"?\n\nCurrent bid: $${auction.currentPrice || auction.startingPrice}\nTotal bids: ${bidCount}\n\nThis will finalize the auction and confirm the highest bidder as the winner.`
      )
      if (!confirmClose) return
    }

    try {
      console.log(`🔒 Closing auction: ${auction.id}`)
      
      // Call close API (backend will determine winner)
      await auctionAPI.closeAuction(auction.id)
      
      console.log(`✅ Auction closed successfully: ${auction.id}`)
      
      // Update local state to mark as closed
      setUserAuctions(prevAuctions => 
        prevAuctions.map(a => 
          a.id === auction.id 
            ? { ...a, status: 'Closed', endTime: new Date().toISOString() } 
            : a
        )
      )
      
      // Show success message
      alert(`Auction "${auction.title}" has been closed successfully!${bidCount > 0 ? '\nThe highest bidder has been notified.' : ''}`)
      
      // Refresh dashboard data
      if (user) {
        fetchUserDashboardData(user)
      }
      
    } catch (error) {
      console.error('❌ Error closing auction:', error)
      alert(`Failed to close auction: ${error.message || 'Unknown error'}`)
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div key="active-bids-card" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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

          <div key="your-auctions-card" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
            <div className="text-xs text-gray-400 mt-1">
              Active: {dashboardLoading ? '...' : (Array.isArray(userAuctions) ? userAuctions.filter(a => getAuctionStatus(a) === 'Active').length : 0)} | 
              Ended: {dashboardLoading ? '...' : (Array.isArray(userAuctions) ? userAuctions.filter(a => getAuctionStatus(a) === 'Ended').length : 0)}
            </div>
          </div>

          <div key="winning-bids-card" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
              <h2 className="text-xl font-semibold text-gray-900">Your Active Auctions</h2>
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
            ) : (() => {
              const activeAuctions = Array.isArray(userAuctions) 
                ? userAuctions.filter(auction => getAuctionStatus(auction) === 'Active')
                : [];
              
              return activeAuctions.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active auctions</h3>
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
                  {activeAuctions.slice(0, 5).map((auction) => {
                    const status = getAuctionStatus(auction);
                    const bidCount = calculateBidCount(auction);
                    
                    return (
                      <div key={auction.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{auction?.title || 'Untitled Auction'}</h3>
                              <p className="text-sm text-gray-600 mb-2">{auction.category}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Starting: ${auction?.startingPrice || 0}</span>
                                <span>Current: ${auction?.currentPrice || 0}</span>
                                <span>Bids: {bidCount}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                            <div className="text-sm text-gray-500">
                              Ends: {auction.endTime ? new Date(auction.endTime).toLocaleDateString() : 'No end date'}
                            </div>
                            {bidCount > 0 && (
                              <div className="text-xs text-blue-600">
                                💰 {bidCount} bid{bidCount !== 1 ? 's' : ''}
                              </div>
                            )}
                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <button
                                onClick={() => router.push(`/auction/${auction.id}`)}
                                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                title="View auction details"
                              >
                                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              <button
                                onClick={() => handleCloseAuction(auction)}
                                className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium"
                                title="Close this auction and confirm winner"
                              >
                                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Close
                              </button>
                              <button
                                onClick={() => handleDeleteAuction(auction)}
                                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                title="Delete this auction"
                              >
                                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {activeAuctions.length > 5 && (
                    <button
                      onClick={() => setActiveTab('selling')}
                      className="w-full py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View all {activeAuctions.length} auctions →
                    </button>
                  )}
                </div>
              );
            })()}
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
                  <div className="w-full h-32 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-3">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
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
            {/* Active Auctions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Active Auctions</h2>
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
              ) : (() => {
                const activeAuctions = Array.isArray(userAuctions) 
                  ? userAuctions.filter(auction => {
                      const status = getAuctionStatus(auction);
                      return status === 'Active';
                    })
                  : [];
                
                return activeAuctions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeAuctions.map((auction) => {
                      const status = getAuctionStatus(auction);
                      const bidCount = calculateBidCount(auction);
                      
                      return (
                        <div key={auction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <img
                            src={auction?.images?.[0] || '/rolex.jpg'}
                            alt={auction?.title || 'Auction item'}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                          <h3 className="font-medium text-gray-900 mb-2">{auction?.title || 'Untitled Auction'}</h3>
                          <div className="space-y-1 text-sm mb-3">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Current Price:</span>
                              <span className="font-medium">${(auction?.currentPrice || auction?.startingPrice || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Total Bids:</span>
                              <span className="font-medium">{bidCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Ends:</span>
                              <span className="font-medium text-sm">
                                {auction.endTime ? new Date(auction.endTime).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status:</span>
                              <span className="font-medium text-green-600">Active</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => router.push(`/auction/${auction.id}`)}
                              className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            {status === 'Active' && (
                              <button
                                onClick={() => handleCloseAuction(auction)}
                                className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                title="Close this auction and confirm winner"
                              >
                                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Close
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAuction(auction)}
                              className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                              title="Delete this auction permanently"
                            >
                              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p>No active auctions</p>
                    <p className="text-sm">Create your first auction to start selling!</p>
                    <button
                      onClick={() => router.push('/sell')}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Auction
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Ended Auctions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Ended Auctions</h2>
                <span className="text-sm text-gray-500">
                  {Array.isArray(userAuctions) 
                    ? userAuctions.filter(auction => getAuctionStatus(auction) === 'Ended').length 
                    : 0} ended
                </span>
              </div>
              {dashboardLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (() => {
                const endedAuctions = Array.isArray(userAuctions) 
                  ? userAuctions.filter(auction => getAuctionStatus(auction) === 'Ended')
                  : [];
                
                return endedAuctions.length > 0 ? (
                  <div className="space-y-4">
                    {endedAuctions.map((auction) => {
                      const bidCount = calculateBidCount(auction);
                      const finalPrice = auction.currentPrice || auction.startingPrice || 0;
                      
                      return (
                        <div key={auction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-4">
                            <img
                              src={auction?.images?.[0] || '/rolex.jpg'}
                              alt={auction?.title || 'Auction item'}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{auction?.title || 'Untitled Auction'}</h3>
                              <p className="text-sm text-gray-600">
                                Final Price: <span className="font-semibold text-orange-600">${finalPrice.toLocaleString()}</span>
                              </p>
                              <p className="text-sm text-gray-500">
                                Total Bids: {bidCount}
                              </p>
                              <p className="text-xs text-gray-400">
                                Ended: {auction.endTime ? new Date(auction.endTime).toLocaleDateString() : 'Recently'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                              Ended
                            </span>
                            <button
                              onClick={() => router.push(`/auction/${auction.id}`)}
                              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteAuction(auction)}
                              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                              title="Remove this ended auction"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No ended auctions</p>
                    <p className="text-sm">Auctions that pass their end time will appear here</p>
                  </div>
                );
              })()}
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
                    <div key="profile-total-bids" className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Array.isArray(userBids) ? userBids.length : 0}
                      </div>
                      <div className="text-sm text-blue-800">Total Bids</div>
                    </div>
                    
                    <div key="profile-my-auctions" className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Array.isArray(userAuctions) ? userAuctions.length : 0}
                      </div>
                      <div className="text-sm text-green-800">My Auctions</div>
                    </div>
                    
                    <div key="profile-winning-bids" className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Array.isArray(userBids) ? userBids.filter(bid => bid.isWinning).length : 0}
                      </div>
                      <div className="text-sm text-orange-800">Winning Bids</div>
                    </div>

                    <div key="profile-closed-auctions" className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {Array.isArray(userAuctions) ? userAuctions.filter(auction => auction.status === 'Closed').length : 0}
                      </div>
                      <div className="text-sm text-gray-800">Closed Auctions</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div key="profile-active-auctions" className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {Array.isArray(userAuctions) ? userAuctions.filter(auction => auction.status === 'Active').length : 0}
                      </div>
                      <div className="text-sm text-red-800">Active Auctions</div>
                    </div>
                    
                    <div key="profile-total-spent" className="bg-indigo-50 p-4 rounded-lg text-center">
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

              {/* Closed Auctions Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Closed Auctions</h3>
                {dashboardLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  (() => {
                    const closedAuctions = Array.isArray(userAuctions) 
                      ? userAuctions.filter(auction => auction.status === 'Closed')
                      : [];
                    
                    return closedAuctions.length > 0 ? (
                      <div className="space-y-4">
                        {closedAuctions.map((auction) => {
                          const bidCount = calculateBidCount(auction);
                          const highestBid = auction.currentPrice || auction.startingPrice;
                          
                          return (
                            <div key={auction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-4">
                                <img
                                  src={auction.images?.[0] || '/rolex.jpg'}
                                  alt={auction.title}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div>
                                  <h4 className="font-semibold text-gray-900">{auction.title}</h4>
                                  <p className="text-sm text-gray-600">
                                    Final Price: <span className="font-semibold text-green-600">${highestBid.toLocaleString()}</span>
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Total Bids: {bidCount}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Closed: {auction.endTime ? new Date(auction.endTime).toLocaleDateString() : 'Recently'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                                  Closed
                                </span>
                                <button
                                  onClick={() => router.push(`/auction/${auction.id}`)}
                                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">No Closed Auctions</p>
                        <p className="text-sm">Your closed auctions will appear here</p>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}