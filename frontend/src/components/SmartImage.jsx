import { useState } from 'react';

export default function SmartImage({ src, alt = '', className = '', eager = false, fallback = '/fallback-fashion.svg', ...props }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  return (
    <img
      {...props}
      src={currentSrc || fallback}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={(event) => {
        if (event.currentTarget.src !== new URL(fallback, window.location.origin).href) {
          setCurrentSrc(fallback);
        }
      }}
    />
  );
}
