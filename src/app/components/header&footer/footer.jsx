'use client';

import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin, Shield, CheckCircle, Users, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white " >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Premium Auctions Section */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Premium Auctions</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The world's premier online auction house, connecting collectors with exceptional items since 2024. Experience the thrill of discovery and the joy of acquisition.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-6 h-6 text-gray-400 hover:text-yellow-400 cursor-pointer transition-colors" />
              <Twitter className="w-6 h-6 text-gray-400 hover:text-yellow-400 cursor-pointer transition-colors" />
              <Instagram className="w-6 h-6 text-gray-400 hover:text-yellow-400 cursor-pointer transition-colors" />
              <Linkedin className="w-6 h-6 text-gray-400 hover:text-yellow-400 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-xl font-bold text-yellow-400 mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Browse Auctions</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Sell with Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">My Dashboard</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Watchlist</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">How It Works</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Expert Valuations</a></li>
            </ul>
          </div>

          {/* Categories Section */}
          <div>
            <h3 className="text-xl font-bold text-yellow-400 mb-6">Categories</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Fine Art & Antiques</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Luxury Watches</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Classic Vehicles</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Designer Fashion</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Rare Collectibles</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Fine Jewelry</a></li>
            </ul>
          </div>

          {/* Stay Connected Section */}
          <div>
            <h3 className="text-xl font-bold text-yellow-400 mb-6">Stay Connected</h3>
            
            {/* Contact Info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">+94 77 123 4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">support@premiumauctions.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-gray-300">
                  <div>57/4 Colombo 03</div>
                  <div>Colombo</div>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-lg font-bold text-yellow-400 mb-3">Newsletter</h4>
              <p className="text-gray-300 mb-4 text-sm">
                Get notified about exclusive auctions and special events.
              </p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-l-lg focus:outline-none focus:border-yellow-400 text-white placeholder-gray-400"
                />
                <button className="px-6 py-2 bg-yellow-400 text-slate-800 font-semibold rounded-r-lg hover:bg-yellow-300 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Verified Sellers</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Buyer Protection</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
          </div>

          {/* Copyright and Links */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 Premium Auctions. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Cookie Policy</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Accessibility</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Help Center</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;