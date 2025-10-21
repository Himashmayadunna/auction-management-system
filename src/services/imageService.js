// services/imageService.js
// Service for handling image uploads and management with backend API

const API_BASE_URL = 'http://localhost:5000';

/**
 * Get authentication token from localStorage
 * Checks both 'authToken' (current system) and 'token' (spec requirement)
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken') || localStorage.getItem('token');
};

/**
 * Validate image file before upload
 * @param {File} file - The image file to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.' 
    };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds 5MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB` 
    };
  }

  return { valid: true, error: null };
};

/**
 * Upload a single image to the backend
 * @param {File} file - The image file to upload
 * @param {number} auctionId - Optional auction ID (for editing existing auctions)
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<Object>} - { imageId, imageUrl, isPrimary, displayOrder }
 */
export const uploadImage = async (file, auctionId = null, onProgress = null) => {
  try {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Validate auctionId
    if (!auctionId) {
      throw new Error('Auction ID is required for image upload');
    }

    // Create FormData according to API spec
    // API expects: ImageFile, IsPrimary (optional), AltText (optional), DisplayOrder (optional)
    const formData = new FormData();
    formData.append('ImageFile', file); // Changed from 'file' to 'ImageFile' per API spec
    
    // Optional: Set first image as primary by default
    // This can be overridden by the caller
    if (file.isPrimary !== undefined) {
      formData.append('IsPrimary', file.isPrimary);
    }
    
    if (file.altText) {
      formData.append('AltText', file.altText);
    }
    
    if (file.displayOrder !== undefined) {
      formData.append('DisplayOrder', file.displayOrder);
    }

    // Get auth token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    console.log('📤 Uploading image:', file.name, 'for auction:', auctionId);

    // Validate auctionId is provided
    if (!auctionId) {
      throw new Error('Auction ID is required for image upload');
    }

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          console.log('✅ Image uploaded successfully:', response);
          resolve(response);
        } else {
          let errorMessage = 'Upload failed';
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.message || error.title || errorMessage;
          } catch (e) {
            errorMessage = xhr.responseText || errorMessage;
          }
          console.error('❌ Upload failed:', errorMessage);
          reject(new Error(errorMessage));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('❌ Network error during upload');
        reject(new Error('Network error during upload'));
      });

      // Send request - IMPORTANT: auctionId must be in the URL path
      const uploadUrl = `${API_BASE_URL}/api/Images/upload/${auctionId}`;
      console.log('📡 Upload URL:', uploadUrl);
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Note: Don't set Content-Type - browser will set it with boundary for FormData
      xhr.send(formData);
    });
  } catch (error) {
    console.error('❌ Error in uploadImage:', error);
    throw error;
  }
};

/**
 * Upload multiple images sequentially
 * @param {number} auctionId - Auction ID (REQUIRED)
 * @param {File[]} files - Array of image files
 * @param {Function} onProgress - Progress callback (current, total, percent)
 * @returns {Promise<Object>} - { successful: Array, failed: Array }
 */
export const uploadMultipleImages = async (auctionId, files, onProgress = null) => {
  console.log('📤 Starting batch upload for auction:', auctionId, '- Files:', files.length);
  
  if (!auctionId) {
    throw new Error('Auction ID is required for uploading images');
  }

  if (!files || files.length === 0) {
    throw new Error('No files provided for upload');
  }

  const successful = [];
  const failed = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    try {
      console.log(`📤 Uploading file ${i + 1}/${total}: ${files[i].name}`);
      
      const result = await uploadImage(files[i], auctionId, (fileProgress) => {
        if (onProgress) {
          const overallProgress = Math.round(((i + fileProgress / 100) / total) * 100);
          onProgress(i + 1, total, overallProgress);
        }
      });
      
      successful.push({ 
        success: true, 
        data: result, 
        file: files[i],
        fileName: files[i].name 
      });
      
      console.log(`✅ File ${i + 1}/${total} uploaded successfully:`, result);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${files[i].name}:`, error);
      failed.push({ 
        success: false, 
        error: error.message, 
        file: files[i],
        fileName: files[i].name 
      });
    }
  }

  console.log(`📊 Upload complete: ${successful.length} successful, ${failed.length} failed`);

  return { successful, failed };
};

/**
 * Get all images for a specific auction
 * @param {number} auctionId - The auction ID
 * @returns {Promise<Array>} - Array of image objects sorted by displayOrder
 */
export const getAuctionImages = async (auctionId) => {
  try {
    console.log('📥 Fetching images for auction:', auctionId);

    // Note: This is a public endpoint - no authentication required
    // Anyone should be able to view auction images
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };

    // Include token if available (optional)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/images/auction/${auctionId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`);
    }

    const images = await response.json();
    console.log('✅ Fetched images:', images);

    // Sort by display order
    return images.sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    console.error('❌ Error fetching auction images:', error);
    throw error;
  }
};

/**
 * Delete an image
 * @param {number} imageId - The image ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteImage = async (imageId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🗑️ Deleting image:', imageId);

    const response = await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }

    console.log('✅ Image deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    throw error;
  }
};

/**
 * Set an image as primary for an auction
 * @param {number} imageId - The image ID to set as primary
 * @param {number} auctionId - The auction ID
 * @returns {Promise<Object>} - Updated image data
 */
export const setPrimaryImage = async (imageId, auctionId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('⭐ Setting primary image:', imageId, 'for auction:', auctionId);

    const response = await fetch(`${API_BASE_URL}/api/images/${imageId}/set-primary`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ auctionId })
    });

    if (!response.ok) {
      throw new Error(`Failed to set primary image: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Primary image set successfully');
    return result;
  } catch (error) {
    console.error('❌ Error setting primary image:', error);
    throw error;
  }
};

/**
 * Reorder images for an auction
 * @param {Array} imageOrders - Array of {imageId, displayOrder}
 * @returns {Promise<boolean>} - Success status
 */
export const reorderImages = async (imageOrders) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('🔄 Reordering images:', imageOrders);

    const response = await fetch(`${API_BASE_URL}/api/images/reorder`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageOrders)
    });

    if (!response.ok) {
      throw new Error(`Failed to reorder images: ${response.statusText}`);
    }

    console.log('✅ Images reordered successfully');
    return true;
  } catch (error) {
    console.error('❌ Error reordering images:', error);
    throw error;
  }
};

/**
 * Convert relative image path to absolute URL
 * @param {string} relativePath - Relative path like "/uploads/image.jpg"
 * @returns {string} - Full URL like "http://localhost:5000/uploads/image.jpg"
 */
export const getImageUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // If already absolute URL, return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Remove leading slash if present
  const path = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  return `${API_BASE_URL}/${path}`;
};

/**
 * Get placeholder image URL
 * @returns {string} - Data URI for placeholder image
 */
export const getPlaceholderImage = () => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
};

export default {
  validateImageFile,
  uploadImage,
  uploadMultipleImages,
  getAuctionImages,
  deleteImage,
  setPrimaryImage,
  reorderImages,
  getImageUrl,
  getPlaceholderImage
};
