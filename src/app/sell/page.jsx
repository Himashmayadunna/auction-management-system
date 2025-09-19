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

  const goToStep = (n) => {
    setStep(Math.min(Math.max(1, n), 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => goToStep(step + 1);
  const prevStep = () => goToStep(step - 1);

  // Validation per-step: required fields
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
      return images.length > 0 && condition.trim().length > 0;
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

  // Stepper component: fixed container width; shows circles and lines with left-half bold behavior
  function Stepper({ current }) {
    const steps = [1, 2, 3, 4];
    return (
      // increased top margin to give more space between header and stepper
      <div className="w-full flex justify-center mt-8 mb-6">
        <div className="w-[900px] px-6 flex items-center">
          {steps.map((s, idx) => {
            const isActive = current === s;
            const isCompleted = current > s;
            return (
              <div key={s} className="flex items-center">
                {/* Circle */}
                <div
                  onClick={() => goToStep(s)}
                  className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base transition-all ${
                    isActive || isCompleted
                      ? 'bg-[#1e2b44] text-white shadow-md'
                      : 'bg-white text-gray-400 border border-gray-200'
                  }`}
                  aria-current={isActive}
                >
                  {s}
                </div>

                {/* Line to next (render for all but last) */}
                {idx !== steps.length - 1 && (
                  <div className="flex items-center mx-4">
                    {/* The line is two halves (left & right).
                        left half bold when current >= s (active/completed),
                        right half bold when current > s (fully completed).
                    */}
                    <div className="w-36 h-1 flex">
                      {/* left half */}
                      <div
                        className={`flex-1 h-1 transition-all ${
                          current >= s ? 'bg-[#1e2b44]' : 'bg-gray-200'
                        }`}
                      />
                      {/* right half */}
                      <div
                        className={`flex-1 h-1 transition-all ${
                          current > s ? 'bg-[#1e2b44]' : 'bg-gray-200'
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
    <div className="min-h-screen bg-white text-gray-900 w-full flex flex-col">
      {/* Header */}
      <div className="bg-[#1e2b44] py-20 px-8">
        <div className="max-w-[1100px] mx-auto text-center">
          <h1 className="text-[3rem] md:text-[3.25rem] font-bold text-white mb-4 leading-tight">
            Create Your Auction
          </h1>
          <p className="text-lg md:text-xl text-white">
            List your item and reach thousands of potential buyers worldwide
          </p>
        </div>
      </div>

      {/* Stepper (fixed width) */}
      <Stepper current={step} />

      {/* Page-level topic (outside the form) - serif font, a bit larger */}
      <div className="w-[900px] mx-auto text-center mb-6">
        <h2
          className="text-2xl md:text-3xl font-semibold"
          style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
        >
          Basic Info
        </h2>
        <p className="text-gray-600">Title, description, category</p>
      </div>

      {/* Form container: fixed horizontal width  (900px), vertical flexible */}
      <div className="w-[900px] mx-auto mt-8">
        <div className="bg-white p-8 shadow-md rounded-lg">
          {/* Inside the form: inner topic (serif, a bit larger) */}
          <div className="mb-6">
            <h3
              className="text-2xl md:text-3xl font-semibold"
              style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
            >
              Basic Information
            </h3>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <section>
              <div className="space-y-6">
                {/* Auction Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Auction Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Vintage Rolex Submariner 1960s - Excellent Condition"
                    className="w-full p-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
                    maxLength={80}
                  />
                  <p className="text-sm text-gray-500 mt-1">{`${formData.title.length}/80 characters`}</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide detailed information about your item including history, condition, provenance, and any unique features..."
                    className="w-full p-3 border border-gray-300 rounded text-base min-h-[150px] focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
                    maxLength={5000}
                  />
                  <p className="text-sm text-gray-500 mt-1">{`${formData.description.length}/5000 characters`}</p>
                </div>

                {/* Category & Location side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
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
                    <label className="block text-sm font-medium mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, State/Country"
                      className="w-full p-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="vintage, luxury, collectible, rare (comma separated)"
                    className="w-full p-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
                  />
                  <p className="text-sm text-gray-500 mt-1">Help buyers find your item with relevant keywords</p>
                </div>
              </div>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section>
              <h4 className="text-lg font-medium mb-4">Photos & Features</h4>

              <div className="mb-6">
                <h5 className="font-medium mb-3">Upload Photos *</h5>
                <div
                  className="grid gap-4 mb-4"
                  style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  }}
                >
                  {images.map((image, index) => (
                    <div key={index} className="relative rounded-sm overflow-hidden">
                      <Image src={image} alt={`Preview ${index + 1}`} width={100} height={100} unoptimized />
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
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                    <span>Add Photo</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <h5 className="font-medium mb-3">Condition *</h5>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-3 border border-gray-300 rounded">
                  <option value="">Select item condition</option>
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="used">Used</option>
                  <option value="for-parts">For Parts</option>
                </select>
              </div>

              <div>
                <h5 className="font-medium mb-3">Special Features</h5>
                {['authenticity', 'returns', 'premium'].map((f) => (
                  <label key={f} className="flex items-center gap-2 mb-2">
                    <input type="checkbox" checked={features[f]} onChange={(e) => setFeatures((prev) => ({ ...prev, [f]: e.target.checked }))} />
                    <span>
                      {f === 'authenticity' ? 'Authenticity Guarantee' : f === 'returns' ? 'Accept Returns (14-day)' : 'Premium Listing (+$25)'}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section>
              <h4 className="text-lg font-medium mb-4">Pricing & Timing</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="number" name="startingBid" value={formData.startingBid} onChange={handleChange} placeholder="Starting Bid *" className="p-3 border border-gray-300 rounded" />
                <input type="number" name="reservePrice" value={formData.reservePrice} onChange={handleChange} placeholder="Reserve Price (Optional)" className="p-3 border border-gray-300 rounded" />
              </div>
              <select name="duration" value={formData.duration} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded mb-4">
                <option value="">Select Duration *</option>
                <option value="7">7 Days</option>
                <option value="10">10 Days</option>
                <option value="30">30 Days</option>
              </select>
              <input type="text" name="shipping" value={formData.shipping} onChange={handleChange} placeholder="Shipping Cost" className="w-full p-3 border border-gray-300 rounded" />
            </section>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <section className="text-center">
              <h4 className="text-lg font-medium mb-4">Publishing...</h4>
              <p className="text-gray-600">Please wait while we complete your auction listing.</p>
            </section>
          )}
        </div>

        {/* Divider + Buttons moved outside below the card (smaller, rounded buttons) */}
        <div className="mt-6 w-full">
          {/* thin divider line */}
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
                      ? 'bg-[#1e2b44] text-white hover:bg-[#162233]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid(step)}
                  className={`px-4 py-2 text-sm rounded-full transition ${
                    isStepValid(step)
                      ? 'bg-[#1e2b44] text-white hover:bg-[#162233]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Publish
                </button>
              )}

              {step === 4 && (
                <button type="button" className="px-4 py-2 text-sm rounded-full bg-green-600 text-white">
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* bottom spacer so footer has breathing room */}
      <div className="h-24" />
    </div>
  );
}
