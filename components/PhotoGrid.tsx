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

// Her sütun için farklı boyut ayarları
const columnSizes = {
  left: [
    { width: 400, height: 300 },
    { width: 500, height: 400 },
    { width: 600, height: 400 }
  ],
  center: { width: 300, maxHeight: 600 }, // Orta sütun - ince uzun ama daha kısa
  right: [
    { width: 400, height: 300 },
    { width: 500, height: 400 },
    { width: 600, height: 400 }
  ]
};

export default function PhotoGrid({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPhotoRef = useRef<HTMLDivElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getColumnType = (index: number): 'left' | 'center' | 'right' => {
    const position = index % 3;
    if (position === 0) return 'left';
    if (position === 1) return 'center';
    return 'right';
  };

  const getRandomSize = (sizes: Array<{ width: number; height: number }>) => {
    return sizes[Math.floor(Math.random() * sizes.length)];
  };

  const loadPhotos = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      const response = await fetch(`/api/photos?page=${page + 1}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Fotoğrafları sütunlara göre grupla
        const leftPhotos: Photo[] = [];
        const centerPhotos: Photo[] = [];
        const rightPhotos: Photo[] = [];

        data.results.forEach((photo: UnsplashPhoto, index: number) => {
          const columnType = getColumnType(photos.length + index);
          
          let width, height;
          
          if (columnType === 'center') {
            width = columnSizes.center.width;
            height = columnSizes.center.maxHeight;
          } else {
            const randomSize = getRandomSize(columnSizes[columnType]);
            width = randomSize.width;
            height = randomSize.height;
          }

          const processedPhoto = {
            id: photo.id,
            url: photo.urls.regular,
            width,
            height,
            description: photo.description,
            photographer: photo.user.name
          };

          // Fotoğrafı ilgili sütun grubuna ekle
          if (columnType === 'left') {
            leftPhotos.push(processedPhoto);
          } else if (columnType === 'center') {
            centerPhotos.push(processedPhoto);
          } else {
            rightPhotos.push(processedPhoto);
          }
        });

        // Tüm fotoğrafları önceden yükle
        const preloadImages = [...leftPhotos, ...centerPhotos, ...rightPhotos].map(photo => {
          if (typeof window !== 'undefined') {
            const img = new window.Image();
            img.src = photo.url;
            return new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            });
          }
          return Promise.resolve(true);
        });

        // Tüm fotoğraflar yüklendiğinde state'i güncelle
        await Promise.all(preloadImages);

        loadingTimeoutRef.current = setTimeout(() => {
          // Sütunları sırayla ekle
          setPhotos(prev => [
            ...prev,
            ...leftPhotos,
            ...centerPhotos,
            ...rightPhotos
          ]);
          setPage(prev => prev + 1);
          setIsLoading(false);
        }, 300);
      } else {
        setHasMore(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, photos.length]);

  // Component unmount olduğunda timeout'u temizle
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !isLoading && hasMore) {
          loadPhotos();
        }
      },
      {
        rootMargin: '500px', // Daha erken yüklemeye başla
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
          animation: fadeIn 0.5s ease forwards;
        }
        .photo-container:hover {
          transform: translateZ(0) scale(1.02);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
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
        {photos.map((photo, index) => {
          const columnType = getColumnType(index);
          return (
            <div
              key={photo.id}
              ref={index === photos.length - 1 ? lastPhotoRef : null}
              className={`photo-container group ${columnType}-column`}
            >
              <div className="relative" style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}>
                <Image
                  src={photo.url}
                  alt={photo.description || 'Photo'}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="eager"
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
          );
        })}
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