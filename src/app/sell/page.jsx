'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import CustomSelect from '../components/sell/CustomSelect';
import { useRouter } from 'next/navigation';
import { createAuctionItem } from "../../utils/api";



export default function SellPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); 
  const [images, setImages] = useState([]);
  const [isPublishing, setIsPublishing] = useState(true);
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

  // Auto-simulate publishing on Step 4
useEffect(() => {
  if (step === 4) {
    setIsPublishing(true); // show Publishing... first
    const timer = setTimeout(() => {
      setIsPublishing(false); 
      // redirect to dashboard
      router.push('/Dashboard');
    }, 3000); // 3 seconds
    return () => clearTimeout(timer);
  }
}, [step]);




useEffect(() => {
  async function publishAuction() {
    if (step === 4) {
      setIsPublishing(true);

      try {
        const auctionData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          tags: formData.tags,
          startingPrice: parseFloat(formData.startingBid),
          reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
          duration: parseInt(formData.duration),
          shipping: formData.shipping,
          condition,
          features,
          images: JSON.stringify(images),
          startTime: new Date(),
          endTime: new Date(Date.now() + parseInt(formData.duration) * 24 * 60 * 60 * 1000),
          sellerId: 1, // replace with logged-in user
        };

        const result = await createAuctionItem(auctionData);

        alert("Auction created successfully! ID: " + result.id);
        router.push("/Dashboard");
      } catch (err) {
        alert("Error publishing auction: " + err.message);
        setIsPublishing(false);
      }
    }
  }

  publishAuction();
}, [step]);







  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 10); 
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
                
                {/* Photos (TOP) */}

                <div>
                  <label className="block text-sm font-medium mb-3">
                    Photos <span className="text-red-500">*</span>
                  </label>

                  <div className="flex flex-wrap gap-4">

                    {/* Uploaded images */}

                    {images.map((src, i) => (
                      <div
                        key={i}
                        className="relative w-32 h-32 rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center"
                      >
                        <img
                          src={src}
                          alt={`preview-${i}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Upload box (always visible until 10 images) */}

                    {images.length < 10 && (
                      <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 bg-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mb-2"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                         stroke="#6b7280"
                         strokeWidth="2"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        <span className="text-sm text-gray-600">Add Photo</span>
                      </label>
                    )}
                  </div>

                  {/* Helper text */}

                  <p className="text-sm text-gray-500 mt-2">
                    Upload up to 10 high-quality images. First image will be the main photo.
                  </p>
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
                {images.length > 0 ? (
                  <img
                    src={images[0]}
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
                  onClick={nextStep}
                  disabled={!isStepValid(step)}
                  className={`px-4 py-2 text-sm rounded-full transition ${
                    isStepValid(step)
                      ? 'bg-[#22304a] text-white hover:bg-[#162233]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Publish
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
    {isPublishing ? 'Publishing...' : 'Finish'}
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
