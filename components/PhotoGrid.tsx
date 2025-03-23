'use client';

import { useEffect, useState, useCallback, useRef, forwardRef } from 'react';
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

const PhotoItem = forwardRef<HTMLDivElement, { photo: Photo }>(({ photo }, ref) => (
  <div
    ref={ref}
    className="relative group rounded-lg overflow-hidden"
    style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}
  >
    <Image
      src={photo.url}
      alt={photo.description || 'Photo'}
      fill
      className="object-cover"
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
));

PhotoItem.displayName = 'PhotoItem';

export default function PhotoGrid({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [visiblePhotos, setVisiblePhotos] = useState<number>(12); // Başlangıçta gösterilecek fotoğraf sayısı
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

          // Fotoğrafı önceden yükle
          if (typeof window !== 'undefined') {
            const img = new window.Image();
            img.src = photo.urls.regular;
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

        // Yeni fotoğrafları ekle
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

  // Scroll olayını dinle
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollThreshold = 200; // Sayfanın sonuna ne kadar yaklaşıldığında yeni fotoğraflar yükleneceği

      if (documentHeight - scrollPosition < scrollThreshold) {
        setVisiblePhotos(prev => prev + 8); // Her scroll'da 8 fotoğraf daha göster
        loadPhotos();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadPhotos]);

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
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-12 gap-4">
        {/* Sol Sütun */}
        <div className="col-span-3 space-y-4">
          {photos
            .filter((_, index) => getColumnType(index) === 'left')
            .slice(0, Math.ceil(visiblePhotos / 3))
            .map((photo, index) => (
              <PhotoItem
                key={photo.id}
                photo={photo}
                ref={index === Math.ceil(visiblePhotos / 3) - 1 ? lastPhotoRef : null}
              />
            ))}
        </div>

        {/* Orta Sütun */}
        <div className="col-span-6 space-y-4">
          {photos
            .filter((_, index) => getColumnType(index) === 'center')
            .slice(0, Math.ceil(visiblePhotos / 2))
            .map((photo, index) => (
              <PhotoItem
                key={photo.id}
                photo={photo}
                ref={index === Math.ceil(visiblePhotos / 2) - 1 ? lastPhotoRef : null}
              />
            ))}
        </div>

        {/* Sağ Sütun */}
        <div className="col-span-3 space-y-4">
          {photos
            .filter((_, index) => getColumnType(index) === 'right')
            .slice(0, Math.ceil(visiblePhotos / 3))
            .map((photo, index) => (
              <PhotoItem
                key={photo.id}
                photo={photo}
                ref={index === Math.ceil(visiblePhotos / 3) - 1 ? lastPhotoRef : null}
              />
            ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
} 