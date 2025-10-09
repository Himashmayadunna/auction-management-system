// lib/auctionApi.js
import { getAuthToken, getCurrentUser } from './api.js';

// API Base URL - Make sure this matches your running backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5277/api';

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    console.log('🌐 Making API request to:', `${API_BASE_URL}${endpoint}`);
    console.log('📝 Request config:', config);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('📄 Non-JSON response text:', text);
      data = { message: text };
    }

    console.log('📦 Response data:', data);

    if (!response.ok) {
      // Extract error message from response
      let errorMessage = data.message || data.errors?.join(', ') || `Server error: ${response.status}`;
      
      // Check for common database connection errors
      if (errorMessage.includes('SQL Server') || errorMessage.includes('database')) {
        errorMessage = '🔧 Database Connection Error: Your backend cannot connect to SQL Server. Please check DATABASE_TROUBLESHOOTING.md for solutions.';
      } else if (response.status === 500) {
        errorMessage = '🚨 Backend Server Error: The server encountered an internal error. Check your backend logs.';
      } else if (response.status === 404) {
        errorMessage = '📭 Not Found: The requested resource was not found on the server.';
      } else if (response.status === 401) {
        errorMessage = '🔐 Authentication Required: Please sign in to access this resource.';
      }
      
      console.error('❌ API Error:', { status: response.status, data, errorMessage });
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('❌ API Request Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

export const auctionAPI = {
  // Create a new auction
  createAuction: async (auctionData) => {
    try {
      console.log('🚀 Starting auction creation...');
      console.log('📥 Input data:', auctionData);

      // Get current user info from auth
      const currentUser = getCurrentUser();
      console.log('👤 Current user object:', currentUser);
      
      if (!currentUser) {
        throw new Error('User not authenticated - please sign in first');
      }
      
      // Extract user ID with multiple fallbacks
      const userId = currentUser.userId || currentUser.id || currentUser.Id || currentUser.ID;
      console.log('🆔 Extracted userId:', userId, 'Type:', typeof userId);
      
      if (!userId) {
        console.error('❌ No user ID found in:', currentUser);
        throw new Error('No user ID found in authentication data');
      }

      // Create auction object using C# PascalCase naming convention for .NET backend
      const auctionEntity = {
        // Required basic fields with PascalCase (C# convention)
        Title: String(auctionData.title || '').trim(),
        Description: String(auctionData.description || '').trim(),
        StartingPrice: parseFloat(auctionData.startingPrice || auctionData.startingBid || 0),
        SellerId: parseInt(userId, 10),
        
        // Date fields with proper ISO format
        StartTime: new Date().toISOString(),
        EndTime: new Date(Date.now() + (parseInt(auctionData.duration || 7) * 24 * 60 * 60 * 1000)).toISOString(),
        
        // Optional fields with safe defaults
        Category: String(auctionData.category || '').trim() || null,
        Condition: String(auctionData.condition || 'New').trim(),
        Location: String(auctionData.location || '').trim() || null,
        ReservePrice: auctionData.reservePrice ? parseFloat(auctionData.reservePrice) : null,
        
        // Handle images - convert frontend format to backend format
        Images: auctionData.images && Array.isArray(auctionData.images) ? 
          auctionData.images.map((img, index) => {
            const imageUrl = typeof img === 'string' ? img : (img.imageUrl || img);
            
            return {
              ImageUrl: imageUrl,
              AltText: img.altText || auctionData.title || 'Auction Image',
              IsPrimary: img.isPrimary || (index === 0),
              DisplayOrder: img.displayOrder || (index + 1),
              // Log image info for debugging
              _debug: {
                urlLength: imageUrl ? imageUrl.length : 0,
                isBase64: imageUrl ? imageUrl.startsWith('data:') : false,
                originalSize: img.originalSize || 0
              }
            };
          }) : null,
        
        // Additional fields that might be expected by backend
        Tags: auctionData.tags ? String(auctionData.tags).trim() : null,
        Shipping: auctionData.shipping ? String(auctionData.shipping).trim() : null
      };

      // Remove null values to avoid database issues
      Object.keys(auctionEntity).forEach(key => {
        if (auctionEntity[key] === null || auctionEntity[key] === '') {
          delete auctionEntity[key];
        }
      });

      console.log('📤 Cleaned auction entity:', auctionEntity);
      console.log('🔐 Auth token available:', !!getAuthToken());

      // Make the API request
      const response = await apiRequest('/Auctions', {
        method: 'POST',
        body: JSON.stringify(auctionEntity),
      });

      console.log('✅ Auction created successfully:', response);
      return response.data || response;

    } catch (error) {
      console.error('❌ Auction creation failed:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        inputData: auctionData
      });
      
      // Re-throw with more context
      throw new Error(`Auction creation failed: ${error.message}`);
    }
  },

  // Get auction by ID
  getAuction: async (auctionId) => {
    const response = await apiRequest(`/Auctions/${auctionId}`, {
      method: 'GET',
    });
    return response.data || response;
  },

  // Get all auctions (simplified - no filters to avoid column errors)
  getAuctions: async (params = {}) => {
    try {
      console.log('📡 Attempting to fetch auctions from backend...');
      
      // For now, just get all auctions without filters to avoid column errors
      const response = await apiRequest(`/Auctions`, {
        method: 'GET',
      });
      
      console.log('✅ Successfully fetched auctions response:', response);
      
      // Extract auctions from response and transform PascalCase to camelCase
      let auctions = response.data || response;
      
      if (!Array.isArray(auctions)) {
        console.log('⚠️ Response is not an array:', auctions);
        return [];
      }
      
      // Transform each auction from PascalCase (backend) to camelCase (frontend)
      const transformedAuctions = auctions.map(auction => {
        console.log('🔄 Transforming auction:', auction);
        
        return {
          // Map PascalCase backend fields to camelCase frontend fields
          id: auction.auctionId || auction.id,
          title: auction.title || auction.Title,
          description: auction.description || auction.Description,
          startingPrice: auction.startingPrice || auction.StartingPrice,
          currentPrice: auction.currentPrice || auction.CurrentPrice,
          endTime: auction.endTime || auction.EndTime,
          startTime: auction.startTime || auction.StartTime,
          category: auction.category || auction.Category,
          condition: auction.condition || auction.Condition,
          location: auction.location || auction.Location,
          images: auction.images || auction.Images || [auction.primaryImageUrl || auction.PrimaryImageUrl || '/rolex.jpg'],
          sellerId: auction.sellerId || auction.SellerId,
          seller: auction.seller,
          bidCount: auction.totalBids || auction.BidCount || 0,
          viewCount: auction.viewCount || auction.ViewCount || 0,
          status: auction.status || auction.Status,
          isFeatured: auction.isFeatured || auction.IsFeatured || false,
          reservePrice: auction.reservePrice || auction.ReservePrice
        };
      });
      
      console.log(`✅ Successfully transformed ${transformedAuctions.length} auctions:`, transformedAuctions);
      return transformedAuctions;
      
    } catch (error) {
      console.error('❌ getAuctions failed:', {
        message: error.message,
        status: error.status,
        details: error
      });
      
      // Check if this is a column error specifically
      if (error.message && error.message.includes('Invalid column name')) {
        console.log('🔧 Backend database schema needs to be fixed - missing columns detected');
        throw new Error(`Backend database schema error: ${error.message}`);
      }
      
      // For other errors, re-throw so the caller can handle appropriately
      throw error;
    }
  },

  // Get seller's auctions
  getSellerAuctions: async (page = 1, pageSize = 20) => {
    const response = await apiRequest(`/Auctions/seller?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });
    return response.data || response;
  },

  // Update auction
  updateAuction: async (auctionId, updateData) => {
    const response = await apiRequest(`/Auctions/${auctionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data || response;
  },

  // Delete auction
  deleteAuction: async (auctionId) => {
    const response = await apiRequest(`/Auctions/${auctionId}`, {
      method: 'DELETE',
    });
    return response;
  },

  // Place a bid
  placeBid: async (auctionId, amount) => {
    const response = await apiRequest(`/Auctions/${auctionId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(amount) }),
    });
    return response.data || response;
  },

  // Get auction bids
  getAuctionBids: async (auctionId) => {
    const response = await apiRequest(`/Auctions/${auctionId}/bids`, {
      method: 'GET',
    });
    return response.data || response;
  },

  // Add to watchlist
  addToWatchlist: async (auctionId) => {
    const response = await apiRequest(`/Auctions/${auctionId}/watchlist`, {
      method: 'POST',
    });
    return response;
  },

  // Remove from watchlist
  removeFromWatchlist: async (auctionId) => {
    const response = await apiRequest(`/Auctions/${auctionId}/watchlist`, {
      method: 'DELETE',
    });
    return response;
  },

  // Get user's watchlist
  getWatchlist: async () => {
    try {
      const response = await apiRequest('/Auctions/watchlist', {
        method: 'GET',
      });
      return response.data || response;
    } catch (error) {
      console.log('🔍 getWatchlist error (possibly missing columns):', error.message);
      // Return empty array if there are database column issues
      return [];
    }
  },

  // Get categories
  getCategories: async () => {
    const response = await apiRequest('/Auctions/categories', {
      method: 'GET',
    });
    return response.data || response;
  },

  // Get user bids (for dashboard)
  getUserBids: async (page = 1, pageSize = 20) => {
    try {
      const response = await apiRequest(`/Bids/user?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
      });
      return response.data || response;
    } catch (error) {
      console.log('🔍 getUserBids error (possibly missing columns or endpoint):', error.message);
      return [];
    }
  },

  // Get user watchlist (for dashboard)
  getUserWatchlist: async (page = 1, pageSize = 20) => {
    try {
      const response = await apiRequest(`/Watchlist?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
      });
      return response.data || response;
    } catch (error) {
      console.log('🔍 getUserWatchlist error (possibly missing columns or endpoint):', error.message);
      return [];
    }
  },

  // Get user notifications (for dashboard)
  getUserNotifications: async (page = 1, pageSize = 20) => {
    try {
      const response = await apiRequest(`/Notifications?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
      });
      return response.data || response;
    } catch (error) {
      console.log('🔍 getUserNotifications not implemented in backend yet, returning empty array');
      return [];
    }
  },

  // ========================
  // BIDDING API ENDPOINTS
  // ========================

  // Place a bid on an auction (Buyers only, JWT required)
  placeBid: async (auctionId, amount) => {
    try {
      console.log('🎯 Placing bid on auction:', auctionId, 'Amount:', amount);
      
      const response = await apiRequest(`/bidding/auctions/${auctionId}/bid`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      
      console.log('✅ Bid placed successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error placing bid:', error);
      throw error;
    }
  },

  // Get all bids for a specific auction
  getAuctionBids: async (auctionId) => {
    try {
      console.log('📋 Fetching bids for auction:', auctionId);
      
      const response = await apiRequest(`/bidding/auctions/${auctionId}/bids`);
      
      console.log('✅ Auction bids fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching auction bids:', error);
      throw error;
    }
  },

  // Get user's bidding history (JWT required)
  getUserBids: async () => {
    try {
      console.log('📜 Fetching user bidding history');
      
      const response = await apiRequest('/bidding/my-bids');
      
      console.log('✅ User bids fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching user bids:', error);
      throw error;
    }
  },

  // Get bid statistics for an auction
  getBidStats: async (auctionId) => {
    try {
      console.log('📊 Fetching bid statistics for auction:', auctionId);
      
      const response = await apiRequest(`/bidding/auctions/${auctionId}/stats`);
      
      console.log('✅ Bid statistics fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching bid statistics:', error);
      throw error;
    }
  },

  // Get highest bid for an auction
  getHighestBid: async (auctionId) => {
    try {
      console.log('🏆 Fetching highest bid for auction:', auctionId);
      
      const response = await apiRequest(`/bidding/auctions/${auctionId}/highest-bid`);
      
      console.log('✅ Highest bid fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching highest bid:', error);
      throw error;
    }
  }
};

// Auction utility functions
export const auctionUtils = {
  // Calculate time remaining for an auction
  getTimeRemaining: (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, expired: false };
  },
  
  // Get auction status based on start and end time
  getAuctionStatus: (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) {
      return 'upcoming';
    } else if (now >= start && now < end) {
      return 'live';
    } else {
      return 'ended';
    }
  },
  
  // Format time remaining as a readable string
  formatTimeRemaining: (endTime) => {
    const timeLeft = auctionUtils.getTimeRemaining(endTime);
    
    if (timeLeft.expired) {
      return 'Auction ended';
    }
    
    if (timeLeft.days > 0) {
      return `${timeLeft.days} day${timeLeft.days > 1 ? 's' : ''} left`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m left`;
    } else {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s left`;
    }
  }
};