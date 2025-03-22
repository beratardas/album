'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Masonry from 'react-masonry-css';
import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: 'gekGPNspSMkLv7gpmu5HoxwLOF53gy5Jf7OM3dzI9tA',
  fetch: fetch
});

interface Photo {
  id: string;
  url: string;
  title: string;
  photographer: string;
  width: number;
  height: number;
}

const photoSizes = [
  { width: 800, height: 600 },  // 1: Sol üst
  { width: 400, height: 1000 }, // 2: Orta üst
  { width: 600, height: 300 },  // 3: Sağ üst
  { width: 800, height: 800 },  // 4: Sol orta
  { width: 400, height: 800 },  // 5: Orta
  { width: 600, height: 500 },  // 6: Sağ orta
  { width: 800, height: 600 },  // 7: Sol alt
  { width: 600, height: 900 }   // 8: Sağ alt
];

export default function PhotoGrid() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef(null);

  const breakpointColumns = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  const loadPhotos = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await unsplash.photos.list({
        page: pageNum,
        perPage: 8
      });

      if (result.type === 'success') {
        console.log('Unsplash API response:', result.response.results);
        const newPhotos = result.response.results.map((photo: any, index) => {
          const size = photoSizes[index % photoSizes.length];
          return {
            id: photo.id,
            url: photo.urls.regular,
            title: photo.description || 'Untitled',
            photographer: photo.user.name,
            width: size.width,
            height: size.height
          };
        });

        setPhotos(prev => [...prev, ...newPhotos]);
        setPage(prev => prev + 1);
      } else {
        setError('Fotoğraflar yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      setError('Fotoğraflar yüklenirken bir hata oluştu.');
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos(page);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          loadPhotos(page);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loading, page]);

  if (error) {
    return (
      <div className="text-center text-red-600 py-4">
        {error}
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .my-masonry-grid {
          display: flex;
          margin-left: -16px;
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 16px;
          background-clip: padding-box;
        }
        .my-masonry-grid_column > div {
          margin-bottom: 16px;
        }
        .photo-container {
          position: relative;
          background-color: #f0f0f0;
          overflow: hidden;
          border-radius: 8px;
        }
        .photo-container img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: relative;
          z-index: 1;
        }
        .photo-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0);
          transition: background 0.3s ease;
          z-index: 2;
          pointer-events: none;
        }
        .photo-container:hover .photo-overlay {
          background: rgba(0, 0, 0, 0.5);
        }
        .photo-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          color: white;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
          z-index: 3;
        }
        .photo-container:hover .photo-info {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      <Masonry
        breakpointCols={breakpointColumns}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="photo-container"
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: `${photo.width}/${photo.height}`
            }}
          >
            <img
              src={photo.url}
              alt={photo.title}
              loading="lazy"
            />
            <div className="photo-overlay" />
            <div className="photo-info">
              <h3 className="text-lg font-semibold">{photo.title}</h3>
              <p className="text-sm">{photo.photographer}</p>
            </div>
          </div>
        ))}
      </Masonry>
      <div ref={observerTarget} className="h-10" />
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        </div>
      )}
    </>
  );
} 