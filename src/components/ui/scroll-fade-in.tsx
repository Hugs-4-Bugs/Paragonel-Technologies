"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScrollFadeInProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  delay?: string; // e.g., "delay-200"
  duration?: string; // e.g., "duration-1000"
}

export function ScrollFadeIn({
  children,
  className,
  as: Component = 'div',
  delay,
  duration,
}: ScrollFadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (elementRef.current) {
             observer.unobserve(elementRef.current);
          }
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1, // Adjust threshold as needed
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    // Fallback: reveal after a short delay even if the observer never fires
    // (e.g. full-page screenshot capture, no-JS crawl after hydration, or an
    // element that stays below the fold). This guarantees content is never
    // permanently hidden, while still animating for users who scroll into view.
    const fallback = window.setTimeout(() => setIsVisible(true), 1200);

    return () => {
      window.clearTimeout(fallback);
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  const style = {
    transitionDelay: delay,
    transitionDuration: duration,
  };

  return (
    <Component
      ref={elementRef}
      className={cn('scroll-fade-in', isVisible && 'is-visible', className)}
      style={style}
    >
      {children}
    </Component>
  );
}
