'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './sell.module.css';

export default function SellPage() {
  const [images, setImages] = useState([]);
  const [condition, setCondition] = useState('');
  const [features, setFeatures] = useState({
    authenticity: false,
    returns: false,
    premium: false
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...imageUrls]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mock API call - will be replaced with real API later
    console.log({
      images,
      condition,
      features
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBox}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Create Your Auction</h1>
        <p className={styles.subtitle}>List your item and reach thousands of potential buyers worldwide</p>
      </div>
      </div>
      <div className={styles.formContainer}>
      <div className={styles.progress}>
         <div className={`${styles.step} ${styles.stepActive}`}>1</div>
         <div className={`${styles.step} ${styles.stepActive}`}>2</div>
         <div className={styles.step}>3</div>
         <div className={styles.step}>4</div>
     </div>

        <div className={styles.formTopic}>
          <h1 className={styles.formTopicTitle}>Images & Details</h1>
          <p className={styles.formTopicSubtitle}>Photos, condition, specifications</p>
        </div>


      <form onSubmit={handleSubmit} className={styles.form}>
        <section className={styles.section}>

          <div className={styles.imageUpload}>
            <h3>Photos *</h3>
            <div className={styles.imageGrid}>
              {images.map((image, index) => (
                <div key={index} className={styles.imagePreview}>
                  <Image src={image} alt={`Preview ${index + 1}`} width={100} height={100} />
                  <button type="button" onClick={() => removeImage(index)}>&times;</button>
                </div>
              ))}
              <label className={styles.uploadButton}>
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
            <p className={styles.imageHelp}>Upload up to 10 high-quality images. First image will be the main photo.</p>
          </div>

          <div className={styles.condition}>
            <h3>Condition *</h3>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">Select item condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="used">Used</option>
              <option value="for-parts">For Parts</option>
            </select>
          </div>

          <div className={styles.features}>
            <h3>Special Features</h3>
            <label>
              <input
                type="checkbox"
                checked={features.authenticity}
                onChange={(e) => setFeatures(prev => ({ ...prev, authenticity: e.target.checked }))}
              />
              Authenticity Guarantee - Professionally verified
            </label>
            <label>
              <input
                type="checkbox"
                checked={features.returns}
                onChange={(e) => setFeatures(prev => ({ ...prev, returns: e.target.checked }))}
              />
              Accept Returns - 14-day return policy
            </label>
            <label>
              <input
                type="checkbox"
                checked={features.premium}
                onChange={(e) => setFeatures(prev => ({ ...prev, premium: e.target.checked }))}
              />
              Premium Listing - Featured placement (+$25)
            </label>
          </div>
        </section>

        <div className={styles.navigation}>
          <button type="button" className={styles.prevButton}>Previous</button>
          <button type="submit" className={styles.nextButton}>Next</button>
        </div>
      </form>
      </div>
    </div>
  );
}