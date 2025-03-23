'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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



// Her sütun için farklı boyut ayarları
const columnSizes = {
  left: [
    { width: 400, height: 300 },
    { width: 500, height: 400 },
    { width: 600, height: 400 }
  ],
  center: { width: 400, maxHeight: 600 }, // Orta sütun boyutlarını artırdım
  right: [
    { width: 400, height: 300 },
    { width: 500, height: 400 },
    { width: 600, height: 400 }
  ]
};

export default function PhotoGrid({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastLeftRef = useRef<HTMLDivElement | null>(null);
  const lastCenterRef = useRef<HTMLDivElement | null>(null);
  const lastRightRef = useRef<HTMLDivElement | null>(null);

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
      const response = await fetch(`/api/photos?page=${page + 1}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const newPhotos: Photo[] = data.results.map((photo: UnsplashPhoto, index: number) => {
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

          return {
            id: photo.id,
            url: photo.urls.regular,
            width,
            height,
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
  }, [page, isLoading, hasMore, photos.length]);

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
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    // Her sütunun son fotoğrafını gözlemle
    if (lastLeftRef.current) observer.current.observe(lastLeftRef.current);
    if (lastCenterRef.current) observer.current.observe(lastCenterRef.current);
    if (lastRightRef.current) observer.current.observe(lastRightRef.current);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [isLoading, hasMore, loadPhotos]);

  return (
    <div className="relative">
      <style jsx global>{`
        .photo-grid {
          display: flex;
          gap: 16px;
          width: 100%;
          max-width: 1920px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .photo-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .photo-column.left,
        .photo-column.right {
          flex: 1.2;
        }
        .photo-column.center {
          flex: 1;
        }
        .photo-container {
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
        @media (max-width: 1536px) {
          .photo-grid {
            max-width: 1280px;
          }
        }
        @media (max-width: 1280px) {
          .photo-grid {
            max-width: 1024px;
          }
        }
        @media (max-width: 1024px) {
          .photo-grid {
            flex-direction: column;
          }
          .photo-column {
            flex: 1;
          }
        }
        @media (max-width: 768px) {
          .photo-grid {
            max-width: 640px;
          }
        }
        @media (max-width: 640px) {
          .photo-grid {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="photo-grid">
        <div className="photo-column left">
          {photos
            .filter((_, index) => getColumnType(index) === 'left')
            .map((photo, index, array) => (
              <div
                key={photo.id}
                ref={index === array.length - 1 ? lastLeftRef : null}
                className="photo-container"
              >
                <div className="relative" style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}>
                  <Image
                    src={photo.url}
                    alt={photo.description || 'Photo'}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="eager"
                    priority={true}
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
        </div>

        <div className="photo-column center">
          {photos
            .filter((_, index) => getColumnType(index) === 'center')
            .map((photo, index, array) => (
              <div
                key={photo.id}
                ref={index === array.length - 1 ? lastCenterRef : null}
                className="photo-container"
              >
                <div className="relative" style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}>
                  <Image
                    src={photo.url}
                    alt={photo.description || 'Photo'}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="eager"
                    priority={false}
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
        </div>

        <div className="photo-column right">
          {photos
            .filter((_, index) => getColumnType(index) === 'right')
            .map((photo, index, array) => (
              <div
                key={photo.id}
                ref={index === array.length - 1 ? lastRightRef : null}
                className="photo-container"
              >
                <div className="relative" style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}>
                  <Image
                    src={photo.url}
                    alt={photo.description || 'Photo'}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="eager"
                    priority={true}
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
        </div>
      </div>

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