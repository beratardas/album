import PhotoGrid from '@/components/PhotoGrid';

interface Photo {
  id: string;
  url: string;
  width: number;
  height: number;
  description: string | null;
  photographer: string;
}

const initialPhotos: Photo[] = [
  {
    id: '1',
    url: 'https://source.unsplash.com/random/800x600',
    width: 600,
    height: 400,
    description: 'Initial Photo 1',
    photographer: 'Photographer 1'
  },
  {
    id: '2',
    url: 'https://source.unsplash.com/random/400x1000',
    width: 300,
    height: 600,
    description: 'Initial Photo 2',
    photographer: 'Photographer 2'
  },
  {
    id: '3',
    url: 'https://source.unsplash.com/random/600x300',
    width: 300,
    height: 300,
    description: 'Initial Photo 3',
    photographer: 'Photographer 3'
  },
  {
    id: '4',
    url: 'https://source.unsplash.com/random/800x800',
    width: 300,
    height: 300,
    description: 'Initial Photo 4',
    photographer: 'Photographer 4'
  },
  {
    id: '5',
    url: 'https://source.unsplash.com/random/400x800',
    width: 600,
    height: 600,
    description: 'Initial Photo 5',
    photographer: 'Photographer 5'
  },
  {
    id: '6',
    url: 'https://source.unsplash.com/random/600x500',
    width: 300,
    height: 300,
    description: 'Initial Photo 6',
    photographer: 'Photographer 6'
  },
  {
    id: '7',
    url: 'https://source.unsplash.com/random/800x600',
    width: 300,
    height: 600,
    description: 'Initial Photo 7',
    photographer: 'Photographer 7'
  },
  {
    id: '8',
    url: 'https://source.unsplash.com/random/600x900',
    width: 300,
    height: 300,
    description: 'Initial Photo 8',
    photographer: 'Photographer 8'
  }
];

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <PhotoGrid initialPhotos={initialPhotos} />
    </main>
  );
}
