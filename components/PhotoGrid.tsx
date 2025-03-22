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

interface PhotoGridProps {
  initialPhotos: Photo[];
}

const breakpointColumns = {
  default: 3,
  1536: 3,
  1280: 3,
  1024: 2,
  768: 2,
  640: 1
};

export default function PhotoGrid({ initialPhotos }: PhotoGridProps) {
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
        const newPhotos: Photo[] = data.results.map((photo: UnsplashPhoto) => ({
          id: photo.id,
          url: photo.urls.regular,
          width: 800,
          height: 600,
          description: photo.description,
          photographer: photo.user.name
        }));

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
      <style jsx global>{`
        .masonry-grid {
          display: flex;
          width: 100%;
          margin-left: -16px;
        }
        .masonry-grid_column {
          padding-left: 16px;
          background-clip: padding-box;
        }
      `}</style>
      
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            ref={index === photos.length - 1 ? lastPhotoRef : null}
            className="relative mb-4 group"
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
        ))}
      </Masonry>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
} 