'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function SellPage() {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log({ images, condition, features });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] w-full m-0 p-0 font-sans">
      {/* Header */}
      <div className="bg-[#1e2b44] py-16 px-8 mb-8">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="text-[4rem] font-bold text-white mb-4 tracking-tight leading-[1.2]" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            Create Your Auction
          </h1>
          <p className="text-xl font-normal text-white/90 mb-0">
            List your item and reach thousands of potential buyers worldwide
          </p>
        </div>
      </div>

      {/* Form container */}
      <div className="bg-[var(--background)] p-8 max-w-[800px] mx-auto my-8">
        {/* Progress */}
        <div className="relative max-w-[800px] mx-auto my-8 flex justify-center items-center gap-16">
          <div className="absolute left-[15%] right-[15%] top-1/2 h-[2px] bg-gray-300 z-0" />

          <div className="relative z-10 w-9 h-9 rounded-full bg-[#1e2b44] border-[#1e2b44] text-white font-bold text-base flex items-center justify-center">1</div>
          <div className="relative z-10 w-9 h-9 rounded-full bg-[#1e2b44] border-[#1e2b44] text-white font-bold text-base flex items-center justify-center">2</div>
          <div className="relative z-10 w-9 h-9 rounded-full bg-white border-2 border-gray-300 text-gray-600 font-semibold text-base flex items-center justify-center">3</div>
          <div className="relative z-10 w-9 h-9 rounded-full bg-white border-2 border-gray-300 text-gray-600 font-semibold text-base flex items-center justify-center">4</div>
        </div>

        {/* Form topic */}
        <div className="max-w-[800px] mx-auto mb-8 text-center">
          <h1 className="text-[3rem] font-bold mb-2 text-[#1e2b44]" style={{ lineHeight: '1.2' }}>
            Images & Details
          </h1>
          <p className="text-xl text-gray-600 m-0">Photos, condition, specifications</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <section className="bg-[var(--background)] rounded-[13px] p-8 shadow-md mb-8">
            {/* Image upload */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3">Photos *</h3>

              <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                {images.map((image, index) => (
                  <div key={index} className="relative rounded-sm overflow-hidden">
                    <Image src={image} alt={`Preview ${index + 1}`} width={100} height={100} unoptimized />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center border-none cursor-pointer">
                      &times;
                    </button>
                  </div>
                ))}

                <label className="border-2 border-dashed border-gray-300 rounded-sm p-8 text-center cursor-pointer flex items-center justify-center min-h-[100px] hover:border-blue-600 hover:text-blue-600">
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                  <span>Add Photo</span>
                </label>
              </div>

              <p className="text-sm text-gray-600 mt-2">Upload up to 10 high-quality images. First image will be the main photo.</p>
            </div>

            {/* Condition */}
            <div className="mb-8">
              <h3 className="text-base font-medium mb-3">Condition *</h3>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-3 border border-gray-300 rounded text-base">
                <option value="">Select item condition</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="used">Used</option>
                <option value="for-parts">For Parts</option>
              </select>
            </div>

            {/* Features */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-medium">Special Features</h3>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={features.authenticity}
                  onChange={(e) => setFeatures((prev) => ({ ...prev, authenticity: e.target.checked }))}
                />
                <span>Authenticity Guarantee - Professionally verified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={features.returns}
                  onChange={(e) => setFeatures((prev) => ({ ...prev, returns: e.target.checked }))}
                />
                <span>Accept Returns - 14-day return policy</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={features.premium}
                  onChange={(e) => setFeatures((prev) => ({ ...prev, premium: e.target.checked }))}
                />
                <span>Premium Listing - Featured placement (+$25)</span>
              </label>
            </div>
          </section>

          <div className="flex justify-between mt-8">
            <button type="button" className="px-8 py-3 rounded border border-gray-300 bg-gray-100 text-base">Previous</button>
            <button type="submit" className="px-8 py-3 rounded bg-blue-600 text-white hover:bg-blue-800">Next</button>
          </div>
        </form>
      </div>
    </div>
  );
}