'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SellPage() {
  const [step, setStep] = useState(1); // start at step 1
  const [images, setImages] = useState([]);
  const [condition, setCondition] = useState('');
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

  // Auto-simulate publishing on Step 4
  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        alert('Auction Created Successfully!');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...imageUrls]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 w-full">
      {/* Header */}
      <div className="bg-[#1e2b44] py-16 px-8 mb-8">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="text-[3rem] font-bold text-white mb-4">
            Create Your Auction
          </h1>
          <p className="text-xl text-white">
            List your item and reach thousands of potential buyers worldwide
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative max-w-[800px] mx-auto my-8 flex justify-center items-center gap-16">
        <div className="absolute left-[15%] right-[15%] top-1/2 h-[2px] bg-gray-300 z-0" />
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-base ${
              step >= s
                ? 'bg-[#1e2b44] border-[#1e2b44] text-white'
                : 'bg-white border-2 border-gray-300 text-gray-600'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Form container */}
      <div className="bg-white p-8 max-w-[800px] mx-auto mt-8 shadow-md rounded-lg">
        {/* Step 1 */}
        {step === 1 && (
          <section>
            {/* Section Title */}
            <h2 className="text-2xl font-bold mb-2">Basic Info</h2>
            <p className="text-gray-600 mb-6">Title, description, category</p>

            {/* Form Content */}
            <div className="space-y-6">
              {/* Auction Title */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Auction Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Vintage Rolex Submariner 1960s - Excellent Condition"
                  className="w-full p-3 border border-gray-300 rounded text-base"
                  maxLength={80}
                />
                <p className="text-sm text-gray-500 mt-1">0/80 characters</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about your item including history, condition, provenance, and any unique features..."
                  className="w-full p-3 border border-gray-300 rounded text-base min-h-[150px]"
                  maxLength={5000}
                />
                <p className="text-sm text-gray-500 mt-1">0/5000 characters</p>
              </div>

              {/* Category & Location (side by side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded text-base"
                  >
                    <option value="">Select a category</option>
                    <option value="art">Art & Antiques</option>
                    <option value="watches">Watches & Jewelry</option>
                    <option value="electronics">Electronics</option>
                    <option value="vehicles">Vehicles</option>
                    <option value="fashion">Fashion & Accessories</option>
                    <option value="collectibles">Collectibles</option>
                    <option value="music">Musical Instruments</option>
                    <option value="books">Books & Literature</option>
                    <option value="home">Home & Decor</option>
                    <option value="sports">Sports Memorabilia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State/Country"
                    className="w-full p-3 border border-gray-300 rounded text-base"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="vintage, luxury, collectible, rare (comma separated)"
                  className="w-full p-3 border border-gray-300 rounded text-base"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Help buyers find your item with relevant keywords
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Photos & Features</h2>
            <div className="mb-6">
              <h3 className="font-medium mb-3">Upload Photos *</h3>
              <div
                className="grid gap-4 mb-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                }}
              >
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative rounded-sm overflow-hidden"
                  >
                    <Image
                      src={image}
                      alt={`Preview ${index + 1}`}
                      width={100}
                      height={100}
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <label className="border-2 border-dashed border-gray-300 rounded-sm p-6 text-center cursor-pointer flex items-center justify-center hover:border-blue-600 hover:text-blue-600">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <span>Add Photo</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-3">Condition *</h3>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded"
              >
                <option value="">Select item condition</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="used">Used</option>
                <option value="for-parts">For Parts</option>
              </select>
            </div>

            <div>
              <h3 className="font-medium mb-3">Special Features</h3>
              {['authenticity', 'returns', 'premium'].map((f) => (
                <label key={f} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={features[f]}
                    onChange={(e) =>
                      setFeatures((prev) => ({
                        ...prev,
                        [f]: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    {f === 'authenticity'
                      ? 'Authenticity Guarantee'
                      : f === 'returns'
                      ? 'Accept Returns (14-day)'
                      : 'Premium Listing (+$25)'}
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Pricing & Timing</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="number"
                name="startingBid"
                value={formData.startingBid}
                onChange={handleChange}
                placeholder="Starting Bid *"
                className="p-3 border border-gray-300 rounded"
              />
              <input
                type="number"
                name="reservePrice"
                value={formData.reservePrice}
                onChange={handleChange}
                placeholder="Reserve Price (Optional)"
                className="p-3 border border-gray-300 rounded"
              />
            </div>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded mb-4"
            >
              <option value="">Select Duration *</option>
              <option value="7">7 Days</option>
              <option value="10">10 Days</option>
              <option value="30">30 Days</option>
            </select>
            <input
              type="text"
              name="shipping"
              value={formData.shipping}
              onChange={handleChange}
              placeholder="Shipping Cost"
              className="w-full p-3 border border-gray-300 rounded"
            />
          </section>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <section className="text-center">
            <h2 className="text-xl font-bold mb-4">Publishing...</h2>
            <p className="text-gray-600">
              Please wait while we complete your auction listing.
            </p>
          </section>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && step < 4 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-8 py-3 rounded border border-gray-300 bg-gray-100 text-gray-900"
            >
              Previous
            </button>
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 rounded bg-blue-600 text-white hover:bg-blue-800"
            >
              Next
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 rounded bg-blue-600 text-white hover:bg-blue-800"
            >
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
