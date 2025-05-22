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

    return () => {
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
