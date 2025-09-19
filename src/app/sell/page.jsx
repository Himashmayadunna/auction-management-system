'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SellPage() {
  const [step, setStep] = useState(2); // set to 2 for testing Step 2 layout; change to 1 if you want default start
  const [images, setImages] = useState([]);
  const [condition, setCondition] = useState('Very Good - Light wear'); // default as requested
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
    const files = Array.from(e.target.files).slice(0, 10); // limit to 10
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => {
      const combined = [...prev, ...imageUrls];
      return combined.slice(0, 10);
    });
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

  // labels/subtitles per step (for the outside heading)
  const pageHead = {
    1: { title: 'Basic Info', subtitle: 'Title, description, category' },
    2: { title: 'Images & Details', subtitle: 'Photos, condition, specifications' },
    3: { title: 'Pricing & Timing', subtitle: 'Starting bid, duration, shipping' },
    4: { title: 'Review & Publish', subtitle: 'Final review before going live' },
  }[step];

  // Stepper component: fixed container width; shows circles and lines with left-half bold behavior
  function Stepper({ current }) {
    const steps = [1, 2, 3, 4];
    return (
      <div className="w-full flex justify-center mt-10 mb-6">
        <div className="w-[900px] px-6 flex items-center">
          {steps.map((s, idx) => {
            const isActive = current === s;
            const isCompleted = current > s;
            return (
              <div key={s} className="flex items-center">
                <div
                  onClick={() => goToStep(s)}
                  className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base transition-all ${
                    isActive || isCompleted ? 'bg-[#1e2b44] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'
                  }`}
                >
                  {s}
                </div>

                {idx !== steps.length - 1 && (
                  <div className="flex items-center mx-4">
                    <div className="w-36 h-1 flex">
                      <div className={`flex-1 h-1 transition-all ${current >= s ? 'bg-[#1e2b44]' : 'bg-gray-200'}`} />
                      <div className={`flex-1 h-1 transition-all ${current > s ? 'bg-[#1e2b44]' : 'bg-gray-200'}`} />
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
          <p className="text-lg md:text-xl text-white">List your item and reach thousands of potential buyers worldwide</p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper current={step} />

      {/* Page-level dynamic topic (outside the form) */}
      <div className="w-[900px] mx-auto text-center mb-6">
        {/* decreased sizes a bit */}
        <h2 className="text-xl md:text-2xl font-semibold" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
          {pageHead.title}
        </h2>
        <p className="text-gray-600">{pageHead.subtitle}</p>
      </div>

      {/* Form container (fixed width) */}
      <div className="w-[900px] mx-auto mt-8">
        <div className="bg-white p-8 shadow-md rounded-lg">
          {/* Card heading inside the form (dynamic) - decreased size */}
          <div className="mb-6">
            <h3 className="text-xl md:text-2xl font-semibold" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
              {step === 2 ? 'Images & Item Details' : step === 1 ? 'Basic Information' : step === 3 ? 'Pricing & Auction Settings' : 'Review Your Auction'}
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
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Vintage Rolex Submariner 1960s - Excellent Condition" className="w-full p-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]" maxLength={80} />
                  <p className="text-sm text-gray-500 mt-1">{`${formData.title.length}/80 characters`}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Provide detailed information about your item including history, condition, provenance, and any unique features..." className="w-full p-3 border border-gray-300 rounded text-base min-h-[150px] focus:outline-none focus:ring-2 focus:ring-[#1e2b44]" maxLength={5000} />
                  <p className="text-sm text-gray-500 mt-1">{`${formData.description.length}/5000 characters`}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category <span className="text-red-500">*</span></label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]">
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
                    <label className="block text-sm font-medium mb-2">Location <span className="text-red-500">*</span></label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, State/Country" className="w-full p-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="vintage, luxury, collectible, rare (comma separated)" className="w-full p-3 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]" />
                  <p className="text-sm text-gray-500 mt-1">Help buyers find your item with relevant keywords</p>
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Images top -> Condition middle -> Special Features bottom */}
          {step === 2 && (
            <section>
              <div className="space-y-8">
                {/* Photos (TOP) */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Photos <span className="text-red-500">*</span>
                  </label>

                  <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                    {/* Left column: upload card + helper text (moved helper here) */}
                    <div className="flex-shrink-0 flex flex-col items-start">
                      <label className="flex items-center justify-center w-36 h-36 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 bg-white">
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                        <div className="text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2" width="32" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                          <div className="text-sm text-gray-600">Add Photo</div>
                        </div>
                      </label>

                      {/* helper line shown under the upload card (always shown) */}
                      <p className="text-sm text-gray-500 mt-3">Upload up to 10 high-quality images. First image will be the main photo.</p>
                    </div>

                    {/* Right column: Previews (on desktop) or below (on mobile) */}
                    <div className="mt-4 md:mt-0 flex-1 md:ml-6">
                      <div className="flex flex-wrap gap-3 items-start">
                        {images.length > 0 ? (
                          images.map((src, i) => (
                            <div key={i} className="relative w-28 h-20 rounded-md overflow-hidden border border-gray-200">
                              <img src={src} alt={`preview-${i}`} className="object-cover w-full h-full" />
                              <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-sm">×</button>
                            </div>
                          ))
                        ) : (
                          // keep this area empty when no images (user requested removal of the "No photos uploaded yet." text)
                          null
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Condition (MIDDLE) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#1e2b44]">
                    <option value="Mint - Perfect condition">Mint - Perfect condition</option>
                    <option value="Excellent - Minor wear">Excellent - Minor wear</option>
                    <option value="Very Good - Light wear">Very Good - Light wear</option>
                    <option value="Good - Visible wear">Good - Visible wear</option>
                    <option value="Fair - Heavy wear">Fair - Heavy wear</option>
                    <option value="Poor - Significant damage">Poor - Significant damage</option>
                  </select>
                </div>

                {/* Special Features (BOTTOM) */}
                <div>
                  <label className="block text-sm font-medium mb-3">Special Features</label>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={features.authenticity}
                        onChange={(e) => setFeatures((prev) => ({ ...prev, authenticity: e.target.checked }))}
                        className={`mt-1 w-5 h-5 rounded-full border transition ${
                          features.authenticity ? 'bg-[#1e2b44] border-[#1e2b44]' : 'border-gray-300'
                        }`}
                      />
                      <div>
                        <div className="font-medium">Authenticity Guarantee - Professionally verified</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={features.returns}
                        onChange={(e) => setFeatures((prev) => ({ ...prev, returns: e.target.checked }))}
                        className={`mt-1 w-5 h-5 rounded-full border transition ${
                          features.returns ? 'bg-[#1e2b44] border-[#1e2b44]' : 'border-gray-300'
                        }`}
                      />
                      <div>
                        <div className="font-medium">Accept Returns - 14-day return policy</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={features.premium}
                        onChange={(e) => setFeatures((prev) => ({ ...prev, premium: e.target.checked }))}
                        className={`mt-1 w-5 h-5 rounded-full border transition ${
                          features.premium ? 'bg-[#1e2b44] border-[#1e2b44]' : 'border-gray-300'
                        }`}
                      />
                      <div>
                        <div className="font-medium">Premium Listing - Featured placement (+$25)</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Starting Bid <span className="text-red-500">*</span></label>
                  <input type="number" name="startingBid" value={formData.startingBid} onChange={handleChange} placeholder="Starting Bid *" className="w-full p-3 border border-gray-300 rounded" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Reserve Price (Optional)</label>
                    <input type="number" name="reservePrice" value={formData.reservePrice} onChange={handleChange} placeholder="Reserve Price (Optional)" className="w-full p-3 border border-gray-300 rounded" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Duration <span className="text-red-500">*</span></label>
                    <select name="duration" value={formData.duration} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded">
                      <option value="">Select Duration *</option>
                      <option value="7">7 Days</option>
                      <option value="10">10 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Shipping Cost</label>
                  <input type="text" name="shipping" value={formData.shipping} onChange={handleChange} placeholder="Shipping Cost" className="w-full p-3 border border-gray-300 rounded" />
                </div>
              </div>
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
          <div className="w-[900px] mx-auto border-t border-gray-200 mb-6" />

          <div className="w-[900px] mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className={`px-4 py-2 text-sm rounded-full transition ${step === 1 ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-white text-gray-900 border border-gray-300'}`}
            >
              Previous
            </button>

            <div>
              {step < 3 && (
                <button type="button" onClick={nextStep} disabled={!isStepValid(step)} className={`px-4 py-2 text-sm rounded-full transition ${isStepValid(step) ? 'bg-[#1e2b44] text-white hover:bg-[#162233]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  Next
                </button>
              )}

              {step === 3 && (
                <button type="button" onClick={nextStep} disabled={!isStepValid(step)} className={`px-4 py-2 text-sm rounded-full transition ${isStepValid(step) ? 'bg-[#1e2b44] text-white hover:bg-[#162233]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
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
