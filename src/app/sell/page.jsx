'use client';

import { useState, useEffect } from 'react';
import CustomSelect from '../components/sell/CustomSelect';
import ImageUploader from '../components/ImageUploader';
import { useRouter } from 'next/navigation';
import { auctionAPI } from '../../lib/auctionApi';
import { isAuthenticated, getCurrentUser } from '../../lib/api';

export default function SellPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); 
  const [selectedImageFiles, setSelectedImageFiles] = useState([]); // Files before auction is created
  const [uploadedImages, setUploadedImages] = useState([]); // Images after upload
  const [createdAuctionId, setCreatedAuctionId] = useState(null); // Store auction ID after creation
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [condition, setCondition] = useState('Very Good - Light wear'); 
  const [features, setFeatures] = useState({
    authenticity: false,
    returns: false,
    premium: false,
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    tags: '',
    startingBid: '',
    reservePrice: '',
    duration: '',
    shipping: '',
  });

  // Check authentication on page load
  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('🔐 Not authenticated - redirecting to signin');
      router.push('/signin');
      return;
    }
    console.log('✅ User authenticated - can access sell page');
  }, [router]);

  // Auto-publish auction when reaching step 4
  useEffect(() => {
    async function publishAuction() {
      if (step === 4 && !createdAuctionId) {
        // Check authentication first before setting loading state
        const currentUser = getCurrentUser();
        const token = localStorage.getItem('authToken') || localStorage.getItem('token'); // Check both possible token keys
        
        if (!currentUser || !currentUser.userId || !token) {
          console.warn('⚠️ User not authenticated, redirecting to signin');
          console.log('Debug - User:', currentUser);
          console.log('Debug - Token:', token ? 'exists' : 'missing');
          alert('Please sign in to publish an auction.');
          router.push('/signin');
          return;
        }

        setIsPublishing(true);

        try {
          console.log('📤 Creating auction...');
          console.log('👤 Current user:', currentUser);
          console.log('🔐 Token exists:', !!token);

          // Prepare auction data WITHOUT images (images will be uploaded separately)
          const auctionData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category.trim(),
            location: formData.location.trim(),
            tags: formData.tags.trim(),
            startingPrice: parseFloat(formData.startingBid),
            reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
            duration: parseInt(formData.duration),
            shipping: formData.shipping || '0',
            condition: condition,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + parseInt(formData.duration) * 24 * 60 * 60 * 1000).toISOString(),
            features: {
              authenticityGuarantee: features.authenticity,
              acceptReturns: features.returns,
              premiumListing: features.premium,
            },
            status: 'active',
            userId: currentUser.userId,
          };

          console.log('📋 Auction data:', auctionData);

          // Validate required fields
          if (!auctionData.title || !auctionData.description || !auctionData.category) {
            throw new Error('Please fill in all required fields (Title, Description, Category)');
          }

          if (isNaN(auctionData.startingPrice) || auctionData.startingPrice <= 0) {
            throw new Error('Starting price must be a positive number');
          }

          // Create auction first
          const result = await auctionAPI.createAuction(auctionData);
          console.log('✅ Auction created successfully:', result);

          // Store the created auction ID
          const auctionId = result.auctionId || result.id;
          setCreatedAuctionId(auctionId);

          // Now upload images if any were selected
          if (selectedImageFiles && selectedImageFiles.length > 0) {
            console.log(`📤 Starting image upload for ${selectedImageFiles.length} files...`);
            console.log('📋 Files to upload:', selectedImageFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
            
            // Validate files are still valid File objects
            const validFiles = selectedImageFiles.filter(f => f instanceof File);
            if (validFiles.length !== selectedImageFiles.length) {
              console.error('❌ Some files are not valid File objects!', {
                total: selectedImageFiles.length,
                valid: validFiles.length,
                invalid: selectedImageFiles.filter(f => !(f instanceof File))
              });
            }
            
            if (validFiles.length === 0) {
              console.error('❌ No valid files to upload!');
              alert('Image upload failed: No valid files found. Please select images again.');
            } else {
              setUploadingImages(true);
              
              // Import uploadMultipleImages function
              const { uploadMultipleImages } = await import('@/services/imageService');
              
              try {
                const uploadResults = await uploadMultipleImages(
                  auctionId,
                  validFiles,
                  (current, total, percent) => {
                    console.log(`📤 Uploading image ${current} of ${total} (${percent}%)`);
                  }
                );

                // Handle new return format: { successful: [...], failed: [...] }
                const successCount = uploadResults.successful?.length || 0;
                const failedCount = uploadResults.failed?.length || 0;
                
                console.log(`✅ Upload complete: ${successCount} succeeded, ${failedCount} failed`);
                
                if (successCount > 0) {
                  console.log('✅ Uploaded images:', uploadResults.successful.map(r => r.data));
                }
                
                if (failedCount > 0) {
                  console.error('❌ Failed uploads:', uploadResults.failed.map(r => ({ file: r.fileName, error: r.error })));
                  alert(`Warning: ${failedCount} image(s) failed to upload. Check console for details.`);
                }
                
                setUploadingImages(false);
              } catch (uploadError) {
                console.error('❌ Image upload error:', uploadError);
                setUploadingImages(false);
                alert(`Image upload failed: ${uploadError.message}\nAuction was created but images were not uploaded.`);
              }
            }
          } else {
            console.log('ℹ️ No images to upload');
          }
          
          // Show success message
          alert('Auction published successfully!');
          
          // Redirect to auction detail page
          setTimeout(() => {
            setIsPublishing(false);
            router.push(`/auction/${auctionId}`);
          }, 500);

        } catch (err) {
          console.error('❌ Error publishing auction:', err);
          
          setIsPublishing(false);
          
          // Show error message
          let errorMessage = "Failed to publish auction:\n\n";
          
          if (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('Authentication Required')) {
            errorMessage += "Authentication Error: Your session has expired. Please log in again.";
            alert(errorMessage);
            // Redirect to signin page
            router.push('/signin');
            return;
          } else if (err.message.includes('Network') || err.message.includes('fetch')) {
            errorMessage += "Network Error: Cannot connect to server. Please check:\n";
            errorMessage += "1. Backend server is running on http://localhost:5000\n";
            errorMessage += "2. Your internet connection is active\n";
            errorMessage += "3. No firewall is blocking the connection";
          } else if (err.message.includes('required fields')) {
            errorMessage += err.message;
            setTimeout(() => router.push('/signin'), 2000);
          } else if (err.message.includes('400') || err.message.includes('Validation')) {
            errorMessage += "Validation Error: " + err.message;
          } else if (err.message.includes('Network') || err.message.includes('fetch')) {
            errorMessage += "Network Error: Cannot connect to server.\nPlease check if backend is running at http://localhost:5000";
          } else {
            errorMessage += err.message || "Unknown error occurred";
          }
          
          alert(errorMessage);
        }
      }
    }

    publishAuction();
  }, [step, createdAuctionId, formData, condition, features, router, selectedImageFiles]);

  // Handle image file changes from ImageUploader component (before upload)
  const handleImageFilesChange = (files) => {
    console.log(`📷 Image selection changed: ${files.length} file(s)`);
    console.log('📋 File details:', files.map(f => ({ 
      name: f.name, 
      size: `${(f.size / 1024).toFixed(2)} KB`, 
      type: f.type,
      lastModified: new Date(f.lastModified).toISOString()
    })));
    setSelectedImageFiles(files);
  };

  // Handle successful image uploads
  const handleImagesUploaded = (uploadedImgs) => {
    console.log(`✅ Successfully uploaded ${uploadedImgs.length} images`);
    setUploadedImages(uploadedImgs);
  };

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form validation
  const validateForm = () => {
    const errors = [];

    if (!formData.title || formData.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    }

    if (!formData.description || formData.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }

    if (!formData.category || formData.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
      errors.push('Starting bid must be greater than 0');
    }

    if (formData.reservePrice && parseFloat(formData.reservePrice) < parseFloat(formData.startingBid)) {
      errors.push('Reserve price cannot be less than starting bid');
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      errors.push('Duration must be selected');
    }

    if (selectedImageFiles.length === 0 && step < 4) {
      errors.push('At least one image is required');
    }

    return errors;
  };

  const goToStep = (n) => {
    setStep(Math.min(Math.max(1, n), 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => goToStep(step + 1);
  const prevStep = () => goToStep(step - 1);

  // Validation
  const isStepValid = (s) => {
    if (s === 1) {
      return (
        formData.title.trim().length > 0 &&
        formData.description.trim().length > 0 &&
        formData.category.trim().length > 0 &&
        formData.location.trim().length > 0
      );
    }
    if (s === 2) {
      return selectedImageFiles.length > 0 && condition.trim().length > 0;
    }
    if (s === 3) {
      return (
        formData.startingBid !== '' &&
        Number(formData.startingBid) > 0 &&
        formData.duration !== ''
      );
    }
    return true;
  };

  // Step 3 fee calculations
  
  const startingBid = parseFloat(formData.startingBid) || 0;
  const finalValueFee = startingBid * 0.1;
  const estimatedReceive = startingBid - finalValueFee;

  const pageHead = {
    1: { title: 'Basic Info', subtitle: 'Title, description, category' },
    2: { title: 'Images & Details', subtitle: 'Photos, condition, specifications' },
    3: { title: 'Pricing & Timing', subtitle: 'Starting bid, duration, shipping' },
    4: { title: 'Review & Publish', subtitle: 'Final review before going live' },
  }[step];

  function Stepper({ current }) {
  const steps = [1, 2, 3, 4];
  return (
    <div className="w-full flex justify-center mt-10 mb-6">
      <div className="w-[900px] px-6 flex justify-center">
        {steps.map((s, idx) => {
          const isActive = current === s;
          const isCompleted = current > s;
          return (
            <div key={s} className="flex items-center">
              <div
                onClick={() => goToStep(s)}
                className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base transition-all ${
                  isActive || isCompleted
                    ? 'bg-[#22304a] text-white shadow-md'
                    : 'bg-white text-gray-400 border border-gray-200'
                }`}
              >
                {s}
              </div>

              {idx !== steps.length - 1 && (
                <div className="flex items-center mx-4">
                  <div className="w-36 h-1 flex">
                    <div
                      className={`flex-1 h-1 transition-all ${
                        current >= s ? 'bg-[#22304a]' : 'bg-gray-200'
                      }`}
                    />
                    <div
                      className={`flex-1 h-1 transition-all ${
                        current > s ? 'bg-[#22304a]' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full flex flex-col">

      {/* Header */}

      <div className="bg-[#22304a] py-20 px-8">
        <div className="max-w-[1100px] mx-auto text-center">
          <h1 className="text-[3rem] md:text-[3rem] font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
                Create Your Auction
          </h1>

          <p className="text-lg md:text-xl text-white">
            List your item and reach thousands of potential buyers worldwide
          </p>
        </div>
      </div>

      {/* Stepper */}

      <Stepper current={step} />

      {/* Page-level heading */}

      <div className="w-[900px] mx-auto text-center mb-6">
        <h2
          className="text-xl md:text-2xl font-semibold"
          style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
        >
          {pageHead.title}
        </h2>
        <p className="text-gray-600">{pageHead.subtitle}</p>
      </div>

      {/* Form container */}

      <div className="w-[900px] mx-auto mt-8">
        <div className="bg-white p-8 border border-gray-200 rounded-lg">
          <div className="mb-6">
            <h3
              className="text-xl md:text-2xl font-semibold"
              style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
            >
              {step === 2
                ? 'Images & Item Details'
                : step === 1
                ? 'Basic Information'
                : step === 3
                ? 'Pricing & Auction Settings'
                : 'Review Your Auction'}
            </h3>
          </div>

          {/* Step 1 */}

          {step === 1 && (
            <section>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Auction Title <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Vintage Rolex Submariner 1960s - Excellent Condition" className="w-full p-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]" maxLength={80} />
                  <p className="text-sm text-gray-500 mt-1">{`${formData.title.length}/80 characters`}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Provide detailed information about your item including history, condition, provenance, and any unique features..." className="w-full p-3 border border-gray-300 rounded-xl text-base min-h-[150px] focus:outline-none focus:ring-2 focus:ring-[#1e2b44]" maxLength={5000} />
                  <p className="text-sm text-gray-500 mt-1">{`${formData.description.length}/5000 characters`}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    
                    <CustomSelect
                       label="Category"
                         options={[
                            "Art & Antiques",
                            "Watches & Jewelry",
                            "Electronics",
                            "Vehicles",
                            "Fashion & Accessories",
                             "Collectibles",
                             "Musical Instruments",
                              "Books & Literature",
                             "Home & Decor",
                             "Sports Memorabilia",
                            ]}
                         value={formData.category}
                         onChange={(val) => setFormData((p) => ({ ...p, category: val }))}
                     />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Location <span className="text-red-500">*</span></label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, State/Country" className="w-full p-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="vintage, luxury, collectible, rare (comma separated)" className="w-full p-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]" />
                  <p className="text-sm text-gray-500 mt-1">Help buyers find your item with relevant keywords</p>
                </div>
              </div>
            </section>
          )}

          {/* Step 2 */}

          {step === 2 && (
            <section>
              <div className="space-y-8">
                
                {/* Photos - NEW Image Uploader Component */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Photos <span className="text-red-500">*</span>
                  </label>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {createdAuctionId 
                      ? 'Upload high-quality images of your item. Images will be uploaded to the server.' 
                      : 'Select images now. They will be uploaded after you create the auction.'}
                  </p>

                  <ImageUploader 
                    auctionId={createdAuctionId}
                    maxImages={10}
                    onImagesChange={handleImageFilesChange}
                    onUploadComplete={handleImagesUploaded}
                    existingImages={uploadedImages}
                  />
                </div>



                {/* Condition (MIDDLE) */}

                <div>
                  <CustomSelect
                    label="Condition"
                    options={[
                      "Mint - Perfect condition",
                      "Excellent - Minor wear",
                      "Very Good - Light wear",
                      "Good - Visible wear",
                      "Fair - Heavy wear",
                      "Poor - Significant damage",
                    ]}
                    value={condition}
                    onChange={setCondition}
                  />
                </div>

                {/* Special Features (BOTTOM) */}

                <div>
                  <label className="block text-sm font-medium mb-3">Special Features</label>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3">
                         <input type="checkbox"
                            checked={features.authenticity}
                            onChange={(e) =>setFeatures((prev) => ({ ...prev, authenticity: e.target.checked }))}className="circle-checkbox"/>
                        <div>
                          <div className="font-medium">
                                Authenticity Guarantee - Professionally verified
                          </div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={features.returns}
                        onChange={(e) =>setFeatures((prev) => ({ ...prev, returns: e.target.checked }))}className="circle-checkbox"/>
                      <div>
                        <div className="font-medium">Accept Returns - 14-day return policy</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={features.premium}
                        onChange={(e) =>setFeatures((prev) => ({ ...prev, premium: e.target.checked }))}className="circle-checkbox"/>
                      <div>
                        <div className="font-medium">Premium Listing - Featured placement (+$25)</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 3 with calculations */}

          {step === 3 && (
            <section>
              <div className="space-y-8">

                {/* Starting Bid + Reserve Price */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Starting Bid <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="startingBid"
                        value={formData.startingBid}
                        onChange={handleChange}
                        placeholder="1000"
                        className="w-full pl-7 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reserve Price (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="reservePrice"
                        value={formData.reservePrice}
                        onChange={handleChange}
                        placeholder="5000"
                        className="w-full pl-7 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum price you'll accept (hidden from bidders)
                    </p>
                  </div>
                </div>

                {/* Auction Duration */}

                <div>
          <CustomSelect
            label="Auction Duration"
            options={[
              "1 Day",
              "3 Days",
              "5 Days",
              "7 Days (Recommended)",
              "10 Days",
            ]}
            value={
              formData.duration
                ? `${formData.duration} ${formData.duration === "1" ? "Day" : "Days"}`
                : ""
            }
            onChange={(val) => {
              // Extract number from string like "7 Days (Recommended)"
              const number = val.split(" ")[0];
              setFormData((p) => ({ ...p, duration: number }));
            }}
          />
        </div>

                {/* Shipping */}
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Shipping Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      name="shipping"
                      value={formData.shipping}
                      onChange={handleChange}
                      placeholder="0 for free shipping"
                      className="w-full pl-7 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Leave blank or enter 0 for free shipping
                  </p>
                </div>

                {/* Fee Breakdown */}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Fee Breakdown</h4>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Listing Fee:</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Final Value Fee (10%):</span>
                    <span>${finalValueFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>You'll receive (estimated):</span>
                    <span className="text-green-600">${estimatedReceive.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          
          {/* Step 4 */}

        {step === 4 && (
          <section>
            {/* Auction Review Card */}

            <div className="bg-gray-100 border-gray-600 rounded-lg p-6 flex gap-6">

              {/* Item Image */}

              <div className="w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                {selectedImageFiles.length > 0 ? (
                  <img
                    src={URL.createObjectURL(selectedImageFiles[0])}
                    alt="item-preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-sm text-gray-400">No image</span>
                )}
              </div>

      {/* Auction Details */}

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="px-3 py-1 bg-[#22304a] rounded-full text-sm font-medium text-gray-50">
            {formData.category || "No category"}
          </span>

          <h3 className="text-xl font-semibold mt-2">{formData.title}</h3>
          <p className="text-gray-700 mt-2">{formData.description}</p>
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm">
          <p>
            <span className="font-medium">Starting Bid:</span>{" "}
            <span className="text-[#22304a] font-semibold">
              ${formData.startingBid}
            </span>
          </p>
          <p>
            <span className="font-medium">Duration:</span>{" "}
            <span className="text-gray-800">
              {formData.duration} days
            </span>
          </p>
          <p>
            <span className="font-medium">Location:</span>{" "}
            <span className="text-gray-800">{formData.location}</span>
          </p>
        </div>
      </div>
    </div>

    {/* Before Publish Note */}

    <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-md text-sm text-yellow-800">
      <h4 className="font-semibold mb-2">Before You Publish</h4>
      <ul className="list-disc list-inside space-y-1">
        <li>Double-check all information for accuracy</li>
        <li>Ensure photos clearly show the item's condition</li>
        <li>Once published, some details cannot be changed</li>
        <li>You'll receive email notifications for bids and messages</li>
      </ul>
    </div>
  </section>
)}
        </div>

        {/* Buttons */}

        <div className="mt-6 w-full">
          <div className="w-[900px] mx-auto border-t border-gray-200 mb-6" />
          <div className="w-[900px] mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className={`px-4 py-2 text-sm rounded-full transition ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-900 border border-gray-300'
              }`}
            >
              Previous
            </button>

            <div>
              {step < 3 && (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid(step)}
                  className={`px-4 py-2 text-sm rounded-full transition ${
                    isStepValid(step)
                      ? 'bg-[#22304a] text-white hover:bg-[#162233]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={() => {
                    const errors = validateForm();
                    if (errors.length > 0) {
                      alert('Please fix the following errors:\n\n' + errors.join('\n'));
                    } else {
                      nextStep();
                    }
                  }}
                  disabled={!isStepValid(step)}
                  className={`px-4 py-2 text-sm rounded-full transition ${
                    isStepValid(step)
                      ? 'bg-[#22304a] text-white hover:bg-[#162233]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Review & Publish
                </button>
              )}

              {step === 4 && (
  <button
    type="button"
    disabled={isPublishing}
    className={`px-4 py-2 text-sm rounded-full ${
      isPublishing
        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
        : 'bg-green-600 text-white'
    }`}
  >
    {uploadingImages 
      ? 'Uploading Images...' 
      : isPublishing 
        ? 'Publishing...' 
        : 'Finish'}
  </button>
)}
            </div>
          </div>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
  
}
