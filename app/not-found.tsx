import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-2">
          This dish or page may have been removed or the link is outdated.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Tip: If you bookmarked a dish page, the database may have been refreshed with new data.
          Search for the dish again from the home page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🏠 Back to Home
          </Link>
          <Link
            href="/discover"
            className="inline-block bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-6 rounded-lg transition-colors border border-blue-200"
          >
            🗺️ Discover
          </Link>
        </div>
      </div>
    </div>
  );
}
