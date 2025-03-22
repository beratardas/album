import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            FotoGaleri
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="search"
                placeholder="Fotoğraf ara..."
                className="w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Yükle
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
} 