'use client'

import Image from 'next/image'

export default function Dashboard() {
  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {/* Welcome Section */}
      <div className="bg-[#1B2641] text-white p-6 rounded-lg mb-6 flex items-center">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, John!</h1>
              <div className="flex items-center gap-2 mt-1">
                <span>⭐ 4.5 rating</span>
                <span>Member since 2023</span>
                <span>47 total bids</span>
              </div>
            </div>
          </div>
        </div>
        <button className="px-4 py-2 bg-white text-gray-800 rounded">Notifications</button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold">47</div>
          <div className="text-gray-600">Total Bids</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold">12</div>
          <div className="text-gray-600">Won Auctions</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold">15</div>
          <div className="text-gray-600">Watchlist</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold">$24,750</div>
          <div className="text-gray-600">Total Spent</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-6 mb-6 text-gray-600">
        <button className="hover:text-gray-900">Overview</button>
        <button className="hover:text-gray-900">Active Bids</button>
        <button className="hover:text-gray-900">Watchlist</button>
        <button className="hover:text-gray-900">Won Items</button>
        <button className="hover:text-gray-900">Selling</button>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-green-500">↗</span>
              <div>
                <div className="font-semibold">You won an auction!</div>
                <div className="text-sm text-gray-600">Vintage Rolex Submariner - $12,500</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">2 hours ago</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>🔨</span>
              <div>
                <div className="font-semibold">New bid placed</div>
                <div className="text-sm text-gray-600">MacBook Pro M2 Max - $3,200</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">5 hours ago</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>❤️</span>
              <div>
                <div className="font-semibold">Item added to watchlist</div>
                <div className="text-sm text-gray-600">Pokemon First Edition Charizard</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">1 day ago</div>
          </div>
        </div>
      </div>

      {/* Ending Soon Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Ending Soon - Your Bids</h2>
          <button className="text-blue-600">View All</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <h3 className="font-semibold">Vintage Rolex Submariner 1960s</h3>
                <div className="text-sm text-gray-600 mt-1">Your bid: $11,000</div>
                <div className="text-sm text-red-500 mt-2">2d 14h 32m</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <h3 className="font-semibold">Original Picasso Sketch 1952</h3>
                <div className="text-sm text-gray-600 mt-1">Your bid: $11,000</div>
                <div className="text-sm text-red-500 mt-2">3d 8h 42m</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}