'use client';

import React from 'react';
import items from '../../../data/item.json';

const AuctionItems = () => {
  return (
    <div className="bg-gradient-to-br from-slate-200 via-slate-300 to-slate-600 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mt-6 pt-6 border-t border-black">
        <h4 className="px-8 py-4 w-20 bg-yellow-400 text-slate-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors " >Featured</h4>
        <h1 className="text-5xl font-bold mb-4 text-center text-black">Premium Auctions</h1>
        <h2 className="text-xl mb-4 text-center text-gray-800">Curated selection of exceptional items from verified sellers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-300 backdrop-blur shadow-lg rounded-xl p-4 hover:scale-105 transition border border-slate-700"
            >
              <img
                src={item.image}
                alt={item.title}
                className="h-60 w-full object-fill rounded-lg mb-3"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Auction+Item';
                }}
              />
              <h2 className="text-xl font-bold mt-3 text-black">{item.title}</h2>
              <p className="text-gray-300">{item.description}</p>
              <p className="text-gray-800 mt-0.2">Current Bid </p>
              <p className="text-black font-semibold mt-0.2"> ${item.price.toLocaleString()}</p>
              <p className="text-sm text-gray-800">Seller: {item.seller}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AuctionItems;
