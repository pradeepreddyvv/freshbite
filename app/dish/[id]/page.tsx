import { notFound } from 'next/navigation';
import { DishHeader } from '@/components/DishHeader';
import { StatsPanel } from '@/components/StatsPanel';
import { ReviewFeed } from '@/components/ReviewFeed';
import { ReviewForm } from '@/components/ReviewForm';
import { ChatPanel } from '@/components/ChatPanel';
import { normalizeTimeWindow } from '@/lib/time-window';
import type { TimeWindow } from '@/lib/time-window';

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    window?: string;
  };
}

interface DishSummaryResponse {
  dish: {
    id: string;
    name: string;
    cuisine?: string | null;
    description?: string | null;
    price?: number | null;
  };
  restaurant: {
    name: string;
    address: string;
    city: string;
  };
  stats: {
    avgRating: number | null;
    reviewCount: number;
    window: TimeWindow;
  };
  risk: {
    level: string;
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
  };
}

interface ReviewListResponse {
  reviews: Array<{
    id: string;
    rating: number;
    text: string;
    createdAt: string;
    mealSlot?: string | null;
  }>;
  stats: {
    avgRating: number | null;
    reviewCount: number;
    window: TimeWindow;
  };
}

async function fetchSummary(id: string, window: TimeWindow) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const response = await fetch(`${baseUrl}/api/dish/${id}/summary?window=${window}`, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as DishSummaryResponse;
}

async function fetchReviews(id: string, window: TimeWindow) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const response = await fetch(`${baseUrl}/api/dish/${id}/reviews?window=${window}`, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as ReviewListResponse;
}

export default async function DishPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const window = normalizeTimeWindow(searchParams.window, '5d');
  const summaryWindow = '24h' as const;

  const [summary, reviewsData] = await Promise.all([
    fetchSummary(id, summaryWindow),
    fetchReviews(id, window),
  ]);

  if (!summary || !reviewsData) {
    notFound();
  }

  const { reviews, stats } = reviewsData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DishHeader
        dishName={summary.dish.name}
        restaurantName={summary.restaurant.name}
        address={summary.restaurant.address}
        city={summary.restaurant.city}
        cuisine={summary.dish.cuisine}
        description={summary.dish.description}
        price={summary.dish.price}
      />

      {/* Stats Panel */}
      <StatsPanel
        avgRating={stats.avgRating}
        reviewCount={stats.reviewCount}
        window={window}
        risk={summary.risk}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Reviews & Form */}
          <div className="lg:col-span-2 space-y-6">
            <ReviewForm dishId={id} />
            <ReviewFeed reviews={reviews} />
          </div>

          {/* Right Column - Chat Stub */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <ChatPanel dishId={id} window={window} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { id } = params;
  const summary = await fetchSummary(id, '24h');
  if (summary) {
    return {
      title: `${summary.dish.name} at ${summary.restaurant.name} - FreshBite`,
      description: summary.dish.description || `See fresh reviews for ${summary.dish.name} at ${summary.restaurant.name}`,
    };
  }

  return {
    title: 'Dish Reviews - FreshBite',
    description: 'Fresh dish reviews that matter',
  };
}
