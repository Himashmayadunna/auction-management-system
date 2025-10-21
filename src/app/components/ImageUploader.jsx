'use client';

import React, { useState, useRef, useCallback } from 'react';
import { validateImageFile, uploadMultipleImages, deleteImage, setPrimaryImage } from '@/services/imageService';

/**
 * ImageUploader Component
 * Handles drag & drop, multiple file selection, preview, reordering, and upload
 * 
 * @param {number} auctionId - The auction ID (required after auction is created)
 * @param {number} maxImages - Maximum number of images allowed (default 10)
 * @param {Function} onUploadComplete - Callback when all uploads complete
 * @param {Array} existingImages - Existing images for edit mode
 * @param {Function} onImagesChange - Callback when images change (for pre-upload state)
 */
const ImageUploader = ({ 
  auctionId = null,
  maxImages = 10, 
  onUploadComplete = null,
  existingImages = [],
  onImagesChange = null
}) => {
  const [images, setImages] = useState(existingImages);
  const [previewFiles, setPreviewFiles] = useState([]); // Files before upload
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [errors, setErrors] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const fileInputRef = useRef(null);

  /**
   * Handle file selection (from input or drag & drop)
   */
  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    setErrors([]);

    // Check total count
    const currentCount = auctionId ? images.length : previewFiles.length;
    const availableSlots = maxImages - currentCount;

    if (fileArray.length > availableSlots) {
      setErrors([`You can only upload ${availableSlots} more image(s). Maximum ${maxImages} images allowed.`]);
      return;
    }

    // Validate each file
    const validFiles = [];
    const newErrors = [];

    fileArray.forEach((file) => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    if (validFiles.length > 0) {
      // If auctionId exists, upload immediately
      if (auctionId) {
        handleUpload(validFiles);
      } else {
        // Otherwise, add to preview (for before auction is created)
        const newPreviewFiles = [...previewFiles, ...validFiles];
        setPreviewFiles(newPreviewFiles);
        
        // Notify parent component
        if (onImagesChange) {
          onImagesChange(newPreviewFiles);
        }
      }
    }
  }, [auctionId, images, previewFiles, maxImages, onImagesChange]);

  /**
   * Upload images to backend
   */
  const handleUpload = async (filesToUpload) => {
    if (!auctionId) {
      setErrors(['Auction ID is required for upload. Please save the auction first.']);
      return;
    }

    setUploading(true);
    setErrors([]);

    try {
      console.log('🚀 Starting upload for', filesToUpload.length, 'files to auction:', auctionId);
      
      const results = await uploadMultipleImages(auctionId, filesToUpload, (current, total, percent) => {
        setUploadProgress({ current, total, percent });
      });

      console.log('📦 Upload results:', results);

      // Handle failures
      if (results.failed && results.failed.length > 0) {
        const errorMessages = results.failed.map(f => `${f.fileName}: ${f.error}`);
        setErrors(errorMessages);
        console.error('❌ Upload failures:', errorMessages);
      }

      // Handle successes
      if (results.successful && results.successful.length > 0) {
        const successfulUploads = results.successful.map(r => r.data);
        const updatedImages = [...images, ...successfulUploads];
        setImages(updatedImages);
        
        console.log('✅ Successfully uploaded', results.successful.length, 'images');
        console.log('📸 Updated images state:', updatedImages);

        // Clear preview files only for successful uploads
        setPreviewFiles([]);

        // Notify parent
        if (onUploadComplete) {
          onUploadComplete(updatedImages);
        }
      }

      // Show summary
      if (results.successful.length > 0 && results.failed.length === 0) {
        console.log('✅ All images uploaded successfully!');
      } else if (results.successful.length > 0 && results.failed.length > 0) {
        console.warn(`⚠️ Partial upload: ${results.successful.length} succeeded, ${results.failed.length} failed`);
      } else if (results.failed.length > 0) {
        console.error('❌ All uploads failed');
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      setErrors([`Upload failed: ${error.message}`]);
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0, percent: 0 });
    }
  };

  /**
   * Remove preview file (before upload)
   */
  const removePreviewFile = (index) => {
    const newPreviewFiles = previewFiles.filter((_, i) => i !== index);
    setPreviewFiles(newPreviewFiles);
    
    if (onImagesChange) {
      onImagesChange(newPreviewFiles);
    }
  };

  /**
   * Delete uploaded image
   */
  const handleDeleteImage = async (imageId) => {
    if (!auctionId) return;

    try {
      await deleteImage(imageId, auctionId);
      const updatedImages = images.filter(img => img.imageId !== imageId);
      setImages(updatedImages);
      
      if (onUploadComplete) {
        onUploadComplete(updatedImages);
      }
    } catch (error) {
      setErrors([`Failed to delete image: ${error.message}`]);
    }
  };

  /**
   * Set image as primary
   */
  const handleSetPrimary = async (imageId) => {
    if (!auctionId) return;

    try {
      await setPrimaryImage(imageId, auctionId);
      
      // Update local state
      const updatedImages = images.map(img => ({
        ...img,
        isPrimary: img.imageId === imageId
      }));
      setImages(updatedImages);
      
      if (onUploadComplete) {
        onUploadComplete(updatedImages);
      }
    } catch (error) {
      setErrors([`Failed to set primary image: ${error.message}`]);
    }
  };

  /**
   * Drag & Drop handlers
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  /**
   * Reordering handlers (drag & drop for reordering)
   */
  const handleReorderDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleReorderDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = auctionId ? [...images] : [...previewFiles];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    if (auctionId) {
      setImages(items);
    } else {
      setPreviewFiles(items);
      if (onImagesChange) {
        onImagesChange(items);
      }
    }

    setDraggedIndex(index);
  };

  const handleReorderDragEnd = () => {
    setDraggedIndex(null);
  };

  /**
   * Get image URL (for uploaded images) or create object URL (for preview files)
   */
  const getImageSrc = (item, isPreview) => {
    if (isPreview) {
      return URL.createObjectURL(item);
    }
    return item.imageUrl?.startsWith('http') 
      ? item.imageUrl 
      : `http://localhost:5000${item.imageUrl}`;
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  // Determine which items to display
  const displayItems = auctionId ? images : previewFiles;
  const isPreviewMode = !auctionId;

  return (
    <div className="w-full">
      {/* Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-white'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center space-y-3">
          {/* Icon */}
          <svg 
            className="w-16 h-16 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>

          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse
            </p>
          </div>

          <p className="text-xs text-gray-400">
            JPG, PNG, GIF, WebP • Max 5MB per file • Up to {maxImages} images
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && uploadProgress.total > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Uploading {uploadProgress.current} of {uploadProgress.total}
            </span>
            <span className="text-sm text-blue-700">
              {uploadProgress.percent}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg 
              className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">
                Upload Errors
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {displayItems.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              {isPreviewMode ? 'Selected Images' : 'Uploaded Images'} ({displayItems.length}/{maxImages})
            </h4>
            <p className="text-xs text-gray-500">
              {isPreviewMode && 'Drag to reorder • First image will be primary'}
              {!isPreviewMode && 'Drag to reorder • Star = primary image'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayItems.map((item, index) => (
              <div
                key={isPreviewMode ? `preview-${index}` : `uploaded-${item.imageId}`}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 cursor-move"
                draggable
                onDragStart={(e) => handleReorderDragStart(e, index)}
                onDragOver={(e) => handleReorderDragOver(e, index)}
                onDragEnd={handleReorderDragEnd}
              >
                {/* Image */}
                <img
                  src={getImageSrc(item, isPreviewMode)}
                  alt={isPreviewMode ? item.name : (item.altText || `Image ${index + 1}`)}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {(index === 0 || (!isPreviewMode && item.isPrimary)) && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Primary</span>
                  </div>
                )}

                {/* File Size (for preview mode) */}
                {isPreviewMode && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                    {formatFileSize(item.size)}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center space-x-2">
                  {/* Set Primary (only for uploaded images) */}
                  {!isPreviewMode && !item.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(item.imageId)}
                      className="opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                      title="Set as primary"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => isPreviewMode ? removePreviewFile(index) : handleDeleteImage(item.imageId)}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      {displayItems.length === 0 && !uploading && (
        <p className="text-sm text-gray-500 text-center mt-4">
          No images selected yet. {isPreviewMode ? 'Add images to preview them here.' : 'Upload images to see them here.'}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
