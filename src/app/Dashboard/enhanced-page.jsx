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
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/signin')
      return
    }

    // Get current user data
    const userData = getCurrentUser()
    setUser(userData)
    setLoading(false)
    
    // Fetch user's auction data
    if (userData) {
      fetchUserDashboardData()
    }
  }, [router])

  // Fetch user's bids, auctions, and watchlist
  const fetchUserDashboardData = async () => {
    try {
      setDashboardLoading(true)
      
      console.log('📊 Dashboard: Fetching comprehensive auction data...')
      
      // Fetch all auctions and filter by user
      const allAuctions = await auctionAPI.getAuctions()
      console.log('📦 All auctions fetched:', allAuctions)
      
      // Filter auctions created by current user
      const userAuctionsData = allAuctions.filter(auction => 
        auction.sellerId === user.userId || 
        (auction.seller && auction.seller.userId === user.userId)
      )
      
      // For now, simulate bids data since we don't have a bids API yet
      // In a real app, you'd fetch from /api/bids/user/{userId}
      const userBidsData = allAuctions.filter((auction, index) => 
        // Simulate user having bid on some auctions (for demo)
        index % 3 === 0 && auction.sellerId !== user.userId
      ).map(auction => ({
        id: `bid_${auction.id}`,
        auctionId: auction.id,
        auction: auction,
        bidAmount: auction.currentPrice + 50, // Simulate bid amount
        bidTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        isWinning: Math.random() > 0.5, // Simulate winning status
        status: auction.status === 'Active' ? 'active' : 'ended'
      }))
      
      // Simulate watchlist (auctions user is watching but hasn't bid on)
      const watchlistData = allAuctions.filter((auction, index) => 
        index % 4 === 0 && 
        auction.sellerId !== user.userId &&
        !userBidsData.some(bid => bid.auctionId === auction.id)
      ).map(auction => ({
        id: `watch_${auction.id}`,
        auction: auction,
        addedDate: new Date(Date.now() - Math.random() * 172800000).toISOString()
      }))
      
      setUserBids(userBidsData)
      setWatchlist(watchlistData)
      setUserAuctions(userAuctionsData)
      
      console.log('✅ Dashboard data loaded:', {
        userAuctions: userAuctionsData?.length || 0,
        activeBids: userBidsData?.length || 0,
        watchlist: watchlistData?.length || 0
      })
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      // Set empty arrays on error
      setUserBids([])
      setWatchlist([])
      setUserAuctions([])
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
              {dashboardLoading ? '...' : userBids.length}
            </div>
            <div className="text-sm text-gray-500">Active Bids</div>
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
                          alt={auction.title}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=📷`;
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{auction.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{auction.category}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Starting: ${auction.startingPrice}</span>
                            <span>Current: ${auction.currentPrice}</span>
                            <span>Bids: {auction.bidCount || 0}</span>
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
                        <div className="text-xs text-blue-600">{bid.auction.title} - ${bid.bidAmount}</div>
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
                    src={bid.auction.images?.[0] || '/rolex.jpg'}
                    alt={bid.auction.title}
                    className="w-full h-32 rounded-lg object-cover mb-3"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/300x128/f3f4f6/9ca3af?text=📷`;
                    }}
                  />
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{bid.auction.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your bid:</span>
                      <span className="font-semibold">${bid.bidAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current price:</span>
                      <span>${bid.auction.currentPrice}</span>
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
                    src={item.auction.images?.[0] || '/rolex.jpg'}
                    alt={item.auction.title}
                    className="w-full h-24 rounded-lg object-cover mb-2"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/200x96/f3f4f6/9ca3af?text=📷`;
                    }}
                  />
                  <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{item.auction.title}</h4>
                  <div className="text-xs text-gray-500">
                    Current: ${item.auction.currentPrice}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}