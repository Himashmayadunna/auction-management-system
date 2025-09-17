'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function SellPage() {
  const [step, setStep] = useState(2); // start at step 2
  const [images, setImages] = useState([]);
  const [condition, setCondition] = useState('');
  const [features, setFeatures] = useState({
    authenticity: false,
    returns: false,
    premium: false,
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...imageUrls]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ step, images, condition, features });
    alert('Form submitted!');
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
    <div className="min-h-screen bg-white text-gray-900 w-full m-0 p-0 font-sans">
      {/* Header */}
      <div className="bg-[#1e2b44] py-16 px-8 mb-8">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="text-[4rem] font-bold text-white mb-4 tracking-tight leading-[1.2]" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            Create Your Auction
          </h1>
          <p className="text-xl font-normal text-white mb-0">
            List your item and reach thousands of potential buyers worldwide
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative max-w-[800px] mx-auto my-8 flex justify-center items-center gap-16">
        <div className="absolute left-[15%] right-[15%] top-1/2 h-[2px] bg-gray-300 z-0" />
        {[1,2,3,4].map((s) => (
          <div key={s} className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-base ${step >= s ? 'bg-[#1e2b44] border-[#1e2b44] text-white' : 'bg-white border-2 border-gray-300 text-gray-600'}`}>{s}</div>
        ))}
      </div>

      {/* Form container */}
      <div className="bg-white p-8 max-w-[800px] mx-auto my-8">
        <form onSubmit={handleSubmit} className="mt-8">

          {/* Step 1 */}
          {step === 1 && (
            <section className="bg-white rounded-[13px] p-8 shadow-md mb-8">
              <h2 className="text-xl font-bold mb-4">Step 1: Basic Info</h2>
              <input type="text" placeholder="Enter item title" className="w-full p-3 border border-gray-300 rounded mb-4" />
              <textarea placeholder="Enter description" className="w-full p-3 border border-gray-300 rounded mb-4"></textarea>
            </section>
          )}

          {/* Step 2 - your existing interface */}
          {step === 2 && (
            <section className="bg-white rounded-[13px] p-8 shadow-md mb-8">
              <div className="mb-8">
                <h3 className="text-base font-medium mb-3">Photos *</h3>
                <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                  {images.map((image, index) => (
                    <div key={index} className="relative rounded-sm overflow-hidden">
                      <Image src={image} alt={`Preview ${index + 1}`} width={100} height={100} unoptimized />
                      <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center border-none cursor-pointer">&times;</button>
                    </div>
                  ))}
                  <label className="border-2 border-dashed border-gray-300 rounded-sm p-8 text-center cursor-pointer flex items-center justify-center min-h-[100px] hover:border-blue-600 hover:text-blue-600">
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                    <span>Add Photo</span>
                  </label>
                </div>
                <p className="text-sm text-gray-700 mt-2">Upload up to 10 high-quality images. First image will be the main photo.</p>
              </div>

              <div className="mb-8">
                <h3 className="text-base font-medium mb-3">Condition *</h3>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-base bg-white text-gray-900">
                  <option value="">Select item condition</option>
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="used">Used</option>
                  <option value="for-parts">For Parts</option>
                </select>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-base font-medium">Special Features</h3>
                {['authenticity','returns','premium'].map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer text-gray-900">
                    <input type="checkbox" checked={features[f]} onChange={(e) => setFeatures(prev => ({...prev, [f]: e.target.checked}))} />
                    <span>{f === 'authenticity' ? 'Authenticity Guarantee - Professionally verified' : f === 'returns' ? 'Accept Returns - 14-day return policy' : 'Premium Listing - Featured placement (+$25)'}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section className="bg-white rounded-[13px] p-8 shadow-md mb-8">
              <h2 className="text-xl font-bold mb-4">Step 3: Pricing & Category</h2>
              <input type="number" placeholder="Enter price" className="w-full p-3 border border-gray-300 rounded mb-4" />
              <select className="w-full p-3 border border-gray-300 rounded mb-4">
                <option>Select Category</option>
                <option>Electronics</option>
                <option>Fashion</option>
              </select>
            </section>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <section className="bg-white rounded-[13px] p-8 shadow-md mb-8">
              <h2 className="text-xl font-bold mb-4">Step 4: Review & Finish</h2>
              <p>Review your entered details and submit.</p>
            </section>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="px-8 py-3 rounded border border-gray-300 bg-gray-100 text-gray-900 text-base">Previous</button>
            )}

            {step < 4 ? (
              <button type="button" onClick={nextStep} className="px-8 py-3 rounded bg-blue-600 text-white hover:bg-blue-800">Next</button>
            ) : (
              <button type="submit" className="px-8 py-3 rounded bg-green-600 text-white hover:bg-green-800">Finish</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
