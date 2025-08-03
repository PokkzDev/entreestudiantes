"use client";

import { useEffect, useState } from 'react';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import styles from '@/components/landing/landing.module.css';

export default function Home() {
  const heroImages = [
    '/pageImages/hero1.jpg',
  ];
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className={styles.page}>
      <Hero heroImages={heroImages} current={current} setCurrent={setCurrent} />
      <Features />
      <HowItWorks />
    </div>
  );
}
