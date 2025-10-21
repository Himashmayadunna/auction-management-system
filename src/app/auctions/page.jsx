"use client";

import React from "react";
import { Search, List, Grid } from "lucide-react";
import items from "../../data/item.json";

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
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#22304a] pt-8 pb-16 px-4 md:px-0">
        <div className="max-w-7xl mx-auto py-5">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold text-white mb-2">Live Auctions</h1>
            <p className="text-lg text-gray-200 mb-6">
              Discover {items.length}+ unique items from verified sellers worldwide
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
            />
          </div>
          <select className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700">
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
          <select className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700">
            {sortOptions.map((opt) => (
              <option key={opt}>{opt}</option>
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
          <span className="text-gray-500">{items.length} items found</span>
        </div>
      </div>

      {/* Auction Items Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-0 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Badges */}
              <div className="flex gap-2 mb-3">
                <span className="bg-orange-400 text-white text-xs font-semibold px-3 py-1 rounded-full">Ending</span>
                {item.id % 2 === 1 && (
                  <span className="bg-yellow-400 text-white text-xs font-semibold px-3 py-1 rounded-full">Premium</span>
                )}
              </div>
              
              {/* Item Image */}
              <div className="mb-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-40 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=Auction+Item';
                  }}
                />
              </div>
              
              {/* Item Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">${item.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">by {item.seller}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Gap before footer */}
        <div className="h-18"></div>
      </div>
    </div>
  );
};

export default AuctionsPage;
