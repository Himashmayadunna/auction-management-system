// lib/imageUtils.js - Image utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Normalizes image URL to absolute URL
 * @param {string} url - Image URL (relative or absolute)
 * @returns {string} - Absolute URL
 */
export const normalizeImageUrl = (url) => {
  if (!url) return null;
  
  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Base64 data URL
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Relative URL - prepend API base URL
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
};

/**
 * Gets proper image URL for display
 * @param {string} path - Image path from backend
 * @returns {string} - Proper image URL
 */
export const getImageUrl = (path) => {
  return normalizeImageUrl(path);
};

/**
 * Creates SVG placeholder image
 * @param {string} text - Placeholder text
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} - Data URL for SVG placeholder
 */
export const createImagePlaceholder = (text = 'No Image', width = 400, height = 300) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" opacity="0.1"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="system-ui, sans-serif" font-size="16" fill="#6b7280">
        ${text}
      </text>
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        </pattern>
      </defs>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Validates image file before upload
 * @param {File} file - File to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please use JPG, PNG, GIF, or WebP.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 5MB.' };
  }
  
  return { valid: true, error: null };
};

/**
 * Compresses image file if it's too large
 * @param {File} file - Image file to compress
 * @param {number} maxSize - Maximum file size in bytes
 * @param {number} quality - JPEG quality (0.1 to 1.0)
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = (file, maxSize = 1024 * 1024, quality = 0.8) => {
  return new Promise((resolve) => {
    if (file.size <= maxSize) {
      resolve(file);
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const maxWidth = 1200;
      const maxHeight = 900;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Converts file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Gets primary image from auction images array
 * @param {Array} images - Array of image objects
 * @returns {Object|null} - Primary image object or null
 */
export const getPrimaryImage = (images) => {
  if (!Array.isArray(images) || images.length === 0) return null;
  
  // Find primary image
  const primary = images.find(img => img.isPrimary || img.IsPrimary);
  if (primary) return primary;
  
  // Return first image if no primary found
  return images[0];
};

/**
 * Sorts images by display order
 * @param {Array} images - Array of image objects
 * @returns {Array} - Sorted images array
 */
export const sortImagesByOrder = (images) => {
  if (!Array.isArray(images)) return [];
  
  return [...images].sort((a, b) => {
    const orderA = a.displayOrder || a.DisplayOrder || 999;
    const orderB = b.displayOrder || b.DisplayOrder || 999;
    return orderA - orderB;
  });
};

export default {
  normalizeImageUrl,
  getImageUrl,
  createImagePlaceholder,
  validateImageFile,
  compressImage,
  fileToBase64,
  getPrimaryImage,
  sortImagesByOrder
};