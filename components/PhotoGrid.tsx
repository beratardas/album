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

const photoSizes = [
  { width: 600, height: 400 },  // 1: Sol üst
  { width: 300, height: 600 },  // 2: Orta üst
  { width: 300, height: 300 },  // 3: Sağ üst 1
  { width: 300, height: 300 },  // 4: Sağ üst 2
  { width: 600, height: 600 },  // 5: Sol alt
  { width: 300, height: 300 },  // 6: Sağ orta 1
  { width: 300, height: 600 },  // 7: Orta alt
  { width: 300, height: 300 },  // 8: Sağ alt
];

export default function PhotoGrid({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPhotoRef = useRef<HTMLDivElement>(null);

  const loadPhotos = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/photos?page=${page + 1}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const newPhotos: Photo[] = data.results.map((photo: UnsplashPhoto, index: number) => {
          const size = photoSizes[index % photoSizes.length];
          return {
            id: photo.id,
            url: photo.urls.regular,
            width: size.width,
            height: size.height,
            description: photo.description,
            photographer: photo.user.name
          };
        });

        setPhotos(prev => [...prev, ...newPhotos]);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !isLoading && hasMore) {
          loadPhotos();
        }
      },
      {
        rootMargin: '100px',
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
  }, [isInitialLoad, isLoading, hasMore, loadPhotos]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-12 gap-4">
        {photos.map((photo, index) => {
          const position = index % 8;
          let className = "relative group overflow-hidden ";
          
          // Her fotoğraf için grid pozisyonunu ayarla
          switch (position) {
            case 0: // 1
              className += "col-span-6 row-span-4";
              break;
            case 1: // 2
              className += "col-span-3 row-span-6";
              break;
            case 2: // 3
              className += "col-span-3 row-span-3";
              break;
            case 3: // 4
              className += "col-span-3 row-span-3";
              break;
            case 4: // 5
              className += "col-span-6 row-span-6";
              break;
            case 5: // 6
              className += "col-span-3 row-span-3";
              break;
            case 6: // 7
              className += "col-span-3 row-span-6";
              break;
            case 7: // 8
              className += "col-span-3 row-span-3";
              break;
          }

          return (
            <div
              key={photo.id}
              ref={index === photos.length - 1 ? lastPhotoRef : null}
              className={className}
              style={{
                aspectRatio: `${photo.width}/${photo.height}`,
                backgroundColor: '#f3f4f6'
              }}
            >
              <Image
                src={photo.url}
                alt={photo.description || 'Photo'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 z-10">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-medium">{photo.photographer}</p>
                  {photo.description && (
                    <p className="text-xs mt-1 line-clamp-2">{photo.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
} 