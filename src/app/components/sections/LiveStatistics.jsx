"use client";

import React, { useState, useEffect } from 'react';
import { Hammer, Users, TrendingUp } from 'lucide-react';

const LiveStatistics = () => {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const allStats = [
    {
      icon: Hammer,
      label: "Active Auctions",
      value: "2,847",
      highlightColor: "bg-white"
    },
    {
      icon: Users,
      label: "Registered Users",
      value: "156K+",
      highlightColor: "bg-white"
    },
    {
      icon: TrendingUp,
      label: "Items Sold Today",
      value: "1,234",
      highlightColor: "bg-yellow-400"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex((prev) => (prev + 1) % allStats.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-200">Live Statistics</h3>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded uppercase font-bold">LIVE</span>
        </div>
      </div>
      <div className="space-y-1 relative">
        <div
          className="absolute left-0 right-0 bg-gradient-to-r from-slate-700/50 to-slate-600/30 rounded-xl border border-slate-600 transition-all duration-700 ease-in-out"
          style={{
            top: `${highlightedIndex * 68}px`,
            height: '60px',
            zIndex: 0
          }}
        />
        {allStats.map((stat, index) => {
          const IconComponent = stat.icon;
          const isHighlighted = index === highlightedIndex;
          return (
            <div
              key={index}
              className="flex items-center justify-between py-4 px-4 rounded-xl transition-all duration-500 ease-in-out relative z-10"
            >
              <div className="flex items-center">
                <IconComponent
                  className={`w-5 h-5 mr-3 transition-colors duration-500 ${
                    isHighlighted
                      ? (index === 2 ? 'text-yellow-400' : 'text-white')
                      : 'text-gray-400'
                  }`}
                />
                <span
                  className={`font-medium transition-colors duration-500 ${
                    isHighlighted ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  {stat.label}
                </span>
              </div>
              <span
                className={`text-xl font-bold transition-all duration-500 ${
                  isHighlighted
                    ? (index === 2 ? 'text-yellow-400 text-2xl' : 'text-white text-2xl')
                    : 'text-white'
                }`}
              >
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveStatistics;
