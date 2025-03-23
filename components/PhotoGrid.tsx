'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Masonry from 'react-masonry-css';
import Image from 'next/image';

interface Photo {
  id: string;
  url: string;
  width: number;
  height: number;
  description: string | null;
  photographer: string;
}

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  description: string | null;
  user: {
    name: string;
  };
}

const breakpointColumns = {
  default: 3,
  1536: 3,
  1280: 3,
  1024: 2,
  768: 2,
  640: 1
};

// Fotoğraf boyutları için yeni düzenleme
const photoSizes = [
  { width: 400, height: 300 }, // Yatay dikdörtgen
  { width: 300, height: 400 }, // Dikey dikdörtgen
  { width: 350, height: 350 }, // Kare
  { width: 400, height: 500 }, // Uzun dikey
  { width: 500, height: 300 }, // Geniş yatay
  { width: 300, height: 300 }  // Küçük kare
];

export default function PhotoGrid({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPhotoRef = useRef<HTMLDivElement | null>(null);

  // Başlangıç fotoğraflarını yükle
  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos);
    }
  }, []);

  // İlk yüklemede fotoğrafları getir
  useEffect(() => {
    if (photos.length === 0) {
      loadPhotos();
    }
  }, []);

  const loadPhotos = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/photos?page=${page + 1}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const newPhotos: Photo[] = data.results.map((photo: UnsplashPhoto) => {
          // Rastgele bir boyut seç
          const randomSize = photoSizes[Math.floor(Math.random() * photoSizes.length)];
          
          return {
            id: photo.id,
            url: photo.urls.regular,
            width: randomSize.width,
            height: randomSize.height,
            description: photo.description,
            photographer: photo.user.name
          };
        });

        setPhotos(prev => [...prev, ...newPhotos]);
        setPage(prev => prev + 1);
        setIsLoading(false);
      } else {
        setHasMore(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  // Infinite scroll için observer
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !isLoading && hasMore) {
          loadPhotos();
        }
      },
      {
        rootMargin: '500px',
        threshold: 0.1
      }
    );

    if (lastPhotoRef.current) {
      observer.current.observe(lastPhotoRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [isLoading, hasMore, loadPhotos]);

  return (
    <div className="relative">
      <style jsx global>{`
        .my-masonry-grid {
          display: flex;
          width: auto;
          margin-left: -16px;
        }
        .my-masonry-grid_column {
          padding-left: 16px;
          background-clip: padding-box;
        }
        .photo-container {
          margin-bottom: 16px;
          break-inside: avoid;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          transform: translateZ(0);
          transition: transform 0.3s ease;
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
        }
        .photo-container:hover {
          transform: translateZ(0) scale(1.02);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <Masonry
        breakpointCols={breakpointColumns}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            ref={index === photos.length - 1 ? lastPhotoRef : null}
            className="photo-container group"
          >
            <div className="relative" style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}>
              <Image
                src={photo.url}
                alt={photo.description || 'Photo'}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="eager"
                priority={index < 6}
                unoptimized
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-sm font-medium truncate">{photo.photographer}</p>
                {photo.description && (
                  <p className="text-xs mt-1 line-clamp-2 opacity-90">{photo.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </Masonry>

      {isLoading && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              <span className="text-sm font-medium text-gray-800">Yükleniyor...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 