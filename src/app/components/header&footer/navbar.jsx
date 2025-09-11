'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, ShoppingCart, Menu, X, Gavel } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Handle search functionality here
    console.log('Search query:', searchQuery);
  };

  return (
    <nav className="bg-white text-gray-800 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <Gavel className="h-7 w-7 text-gray-700" />
            <Link href="/" className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
              AuctionHouse
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 ml-12">
            <Link 
              href="/" 
              className={`font-medium transition-colors px-3 py-2 ${
                pathname === '/' 
                  ? 'text-gray-900 font-semibold border-b-2 border-gray-800' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/auctions" 
              className={`font-medium transition-colors px-3 py-2 ${
                pathname === '/auctions' 
                  ? 'text-gray-900 font-semibold border-b-2 border-gray-800' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Auctions
            </Link>
            <Link 
              href="/sell" 
              className={`font-medium transition-colors flex items-center px-3 py-2 ${
                pathname === '/sell' 
                  ? 'text-gray-900 font-semibold border-b-2 border-gray-800' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-1 text-lg font-bold">+</span>
              Sell
            </Link>
            <Link 
              href="/watchlist" 
              className={`font-medium transition-colors flex items-center px-3 py-2 ${
                pathname === '/watchlist' 
                  ? 'text-gray-900 font-semibold border-b-2 border-gray-800' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2 text-sm">♡</span>
              Watchlist
            </Link>
            <Link 
              href="/Dashboard" 
              className={`font-medium transition-colors px-3 py-2 ${
                pathname === '/Dashboard' 
                  ? 'text-gray-900 font-semibold border-b-2 border-gray-800' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-6">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search auctions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 text-gray-700 placeholder-gray-400 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                />
              </div>
            </form>
          </div>

          {/* Right Side Icons and Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                3
              </span>
            </button>

            {/* Shopping Cart */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                2
              </span>
            </button>

            {/* Sign In Button */}
            <button className="text-gray-600 hover:text-gray-800 transition-colors font-medium px-3 py-2 text-sm">
              Sign In
            </button>

            {/* Join Now Button */}
            <button className="bg-gray-800 hover:bg-gray-900 text-white font-medium px-5 py-2 rounded-md transition-colors text-sm">
              Join Now
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-800 transition-colors p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Search */}
              <div className="mb-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search auctions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 text-gray-700 placeholder-gray-400 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </form>
              </div>

              {/* Mobile Navigation Links */}
              <Link
                href="/"
                className={`block px-3 py-2 transition-colors text-sm ${
                  pathname === '/' 
                    ? 'text-gray-900 font-semibold bg-gray-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/auctions"
                className={`block px-3 py-2 transition-colors text-sm ${
                  pathname === '/auctions' 
                    ? 'text-gray-900 font-semibold bg-gray-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Auctions
              </Link>
              <Link
                href="/sell"
                className={`block px-3 py-2 transition-colors text-sm ${
                  pathname === '/sell' 
                    ? 'text-gray-900 font-semibold bg-gray-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                + Sell
              </Link>
              <Link
                href="/watchlist"
                className={`block px-3 py-2 transition-colors text-sm ${
                  pathname === '/watchlist' 
                    ? 'text-gray-900 font-semibold bg-gray-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ♡ Watchlist
              </Link>
              <Link
                href="/dashboard"
                className={`block px-3 py-2 transition-colors text-sm ${
                  pathname === '/dashboard' 
                    ? 'text-gray-900 font-semibold bg-gray-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>

              {/* Mobile Actions */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm">
                    <Bell className="h-4 w-4" />
                    <span>Notifications (3)</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Cart (2)</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors text-sm">
                    Sign In
                  </button>
                  <button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium px-3 py-2 rounded-md transition-colors text-sm">
                    Join Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;