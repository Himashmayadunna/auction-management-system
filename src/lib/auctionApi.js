// lib/auctionApi.js
import { getAuthToken, getCurrentUser } from './api.js';

// API Base URL - Make sure this matches your running backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    
    // Enhanced logging for auction creation requests
    if (config.method === 'POST' && endpoint === '/Auctions' && config.body) {
      try {
        const bodyData = JSON.parse(config.body);
        console.log('📋 REQUEST BODY SUMMARY:');
        console.log(`   - Title: ${bodyData.Title}`);
        console.log(`   - Images: ${bodyData.Images ? bodyData.Images.length : 0} images`);
        if (bodyData.Images && bodyData.Images.length > 0) {
          console.log('   - Image details:', bodyData.Images.map(img => ({
            hasUrl: !!img.ImageUrl,
            urlType: img.ImageUrl ? (img.ImageUrl.startsWith('data:') ? 'Base64' : 'URL') : 'None',
            length: img.ImageUrl ? img.ImageUrl.length : 0,
            isPrimary: img.IsPrimary
          })));
        }
      } catch (e) {
        console.log('📋 Could not parse request body for logging');
      }
    }
    
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
      
      // Only log as error if it's not an expected auth issue
      if (response.status !== 401) {
        console.error('❌ API Error:', { status: response.status, data, errorMessage });
      } else {
        console.warn('⚠️ Authentication required for:', `${API_BASE_URL}${endpoint}`);
      }
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // Only log detailed errors for non-auth issues
    if (!error.message?.includes('Authentication Required')) {
      console.error('❌ API Request Error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    throw error;
  }
};

// Helper function to transform image URLs from backend  
const transformImageUrls = (auction) => {
  let imageUrls = [];
  
  // Priority 1: Check for primaryImageUrl (this is what your backend returns)
  const primaryUrl = auction.primaryImageUrl || auction.PrimaryImageUrl;
  if (primaryUrl && primaryUrl.trim() !== '') {
    let fullUrl;
    
    // Handle different URL formats from backend
    if (primaryUrl.startsWith('data:')) {
      // Base64 image from database - this is what we want!
      console.log('✅ Found base64 image data from database:', primaryUrl.substring(0, 50) + '...');
      fullUrl = primaryUrl;
      imageUrls = [fullUrl];
      return imageUrls;
    } else if (primaryUrl.startsWith('http://localhost:5000') || primaryUrl.startsWith('https://')) {
      // Proper backend URL
      console.log('✅ Found backend URL from database:', primaryUrl);
      fullUrl = primaryUrl;
      imageUrls = [fullUrl];
      return imageUrls;
    } else if (primaryUrl.startsWith('/uploaded/') || primaryUrl.startsWith('uploaded/')) {
      // Backend relative URL - convert to full URL
      const cleanPath = primaryUrl.startsWith('/') ? primaryUrl : '/' + primaryUrl;
      fullUrl = `http://localhost:5000${cleanPath}`;
      console.log('✅ Converted backend relative URL to full URL:', fullUrl);
      imageUrls = [fullUrl];
      return imageUrls;
    } else {
      // Other paths - try to construct backend URL
      const cleanPath = primaryUrl.startsWith('/') ? primaryUrl : '/' + primaryUrl;
      fullUrl = `http://localhost:5000${cleanPath}`;
      console.log('🔧 Attempting to construct backend URL:', fullUrl);
      imageUrls = [fullUrl];
      return imageUrls;
    }
  }
  
  // Priority 2: Check for images array
  const rawImages = auction.images || auction.Images;
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    imageUrls = rawImages.map(img => {
      if (typeof img === 'object' && img !== null) {
        const url = img.imageUrl || img.ImageUrl || img.url;
        // Only accept base64 or proper backend URLs
        if (url && url.startsWith('data:')) {
          return url; // Base64 image
        } else if (url && url.startsWith('http://localhost:5000')) {
          return url; // Backend URL
        } else if (url && url.startsWith('/uploaded/')) {
          return `http://localhost:5000${url}`; // Convert relative backend URL
        }
        return null; // Reject frontend references
      }
      // Handle string images
      if (typeof img === 'string') {
        if (img.startsWith('data:') || img.startsWith('http://localhost:5000')) {
          return img;
        } else if (img.startsWith('/uploaded/')) {
          return `http://localhost:5000${img}`; // Convert relative backend URL
        }
        return null; // Reject frontend references
      }
      return null;
    }).filter(url => url !== null);
    
    if (imageUrls.length > 0) {
      console.log('✅ Found valid images from database array:', imageUrls.length);
      return imageUrls;
    }
  }
  
  // Priority 3: Check for single image string
  if (typeof rawImages === 'string' && rawImages.trim() !== '') {
    if (rawImages.startsWith('data:') || rawImages.startsWith('http://localhost:5000')) {
      console.log('✅ Found valid single image from database');
      return [rawImages];
    }
  }
  
  // No valid database images found
  console.warn('❌ No valid database images found for auction:', auction.title || auction.Title);
  console.warn('💡 This auction needs actual image data in the database');
  return []; // Return empty array - no images available
};

// Helper function to transform auction from backend format (PascalCase) to frontend format (camelCase)
const transformAuction = (auction) => {
  const imageUrls = transformImageUrls(auction);
  console.log('🖼️ Transformed images for auction', auction.auctionId || auction.id, '- Title:', auction.title || auction.Title, '- Images:', imageUrls);
  
  return {
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
    images: imageUrls,
    sellerId: auction.sellerId || auction.SellerId,
    seller: auction.seller,
    bidCount: auction.totalBids || auction.BidCount || 0,
    viewCount: auction.viewCount || auction.ViewCount || 0,
    status: auction.status || auction.Status,
    isFeatured: auction.isFeatured || auction.IsFeatured || false,
    reservePrice: auction.reservePrice || auction.ReservePrice
  };
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
        
        // Images will be handled by backend file upload
        Images: null,
        
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

      // ENHANCED DEBUG: Log image data being sent to backend
      if (auctionEntity.Images) {
        console.log('🖼️ BACKEND IMAGE DATA BEING SENT:');
        console.log(`   - Number of images: ${auctionEntity.Images.length}`);
        auctionEntity.Images.forEach((img, i) => {
          console.log(`   Image ${i + 1}:`);
          console.log(`     - ImageUrl exists: ${!!img.ImageUrl}`);
          console.log(`     - ImageUrl type: ${img.ImageUrl ? (img.ImageUrl.startsWith('data:') ? 'Base64' : 'URL') : 'None'}`);
          console.log(`     - ImageUrl length: ${img.ImageUrl ? img.ImageUrl.length : 0} chars`);
          console.log(`     - IsPrimary: ${img.IsPrimary}`);
          console.log(`     - DisplayOrder: ${img.DisplayOrder}`);
          console.log(`     - AltText: ${img.AltText}`);
        });
      } else {
        console.log('⚠️ NO IMAGES being sent to backend');
      }

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
    
    const auction = response.data || response;
    console.log('🔄 Transforming single auction:', auction);
    
    return transformAuction(auction);
  },

  // Get all auctions - request large page size to get all auctions
  getAuctions: async (params = {}) => {
    try {
      console.log('📡 Attempting to fetch ALL auctions with images from backend...');
      
      // Request all auctions by setting a large page size (1000) to ensure we get everything
      const response = await apiRequest(`/Auctions?page=1&pageSize=1000`, {
        method: 'GET',
      });
      
      console.log('✅ Successfully fetched auctions response:', response);
      
      // Extract auctions from response - handle { success: true, data: [...] } format
      let auctions = response;
      if (response && response.data && Array.isArray(response.data)) {
        auctions = response.data;
      } else if (Array.isArray(response)) {
        auctions = response;
      } else {
        console.log('⚠️ Response format not recognized:', response);
        return [];
      }
      
      // Transform each auction from PascalCase (backend) to camelCase (frontend)
      const transformedAuctions = auctions.map(auction => {
        console.log('🔄 Transforming auction:', auction);
        return transformAuction(auction);
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
      // Check if user has a valid token before making the request
      const token = getAuthToken();
      if (!token) {
        console.warn('⚠️ No authentication token found, skipping getUserBids');
        return []; // Return empty array instead of throwing error
      }
      
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

// Image upload function for future use
export const uploadImage = async (file) => {
  const token = getAuthToken();
  
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`${API_BASE_URL}/images/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - browser will set it with boundary
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.statusText}`);
  }
  
  return await response.json();
};