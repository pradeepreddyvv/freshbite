import { notFound } from 'next/navigation';
import { DishHeader } from '@/components/DishHeader';
import { StatsPanel } from '@/components/StatsPanel';
import { ReviewFeed } from '@/components/ReviewFeed';
import { ReviewForm } from '@/components/ReviewForm';
import { ChatPanel } from '@/components/ChatPanel';
import { VoiceReviewChat } from '@/components/VoiceReviewChat';
import { normalizeTimeWindow } from '@/lib/time-window';
import { getDishSummary, getDishReviews } from '@/lib/dish-service';
import type { TimeWindow } from '@/lib/time-window';
import type { RiskLevel } from '@/lib/risk-label';

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    window?: string;
  };
}

export default async function DishPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const window = normalizeTimeWindow(searchParams.window, '5d');
  const summaryWindow = '24h' as const;

  // Direct service calls — avoids self-fetch port mismatch issues
  const [summary, reviewsData] = await Promise.all([
    getDishSummary(id, summaryWindow),
    getDishReviews(id, window),
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Chat Panel - shown first on mobile for quick access */}
          <div className="lg:col-span-1 lg:order-2">
            <div className="lg:sticky lg:top-4">
              <ChatPanel dishId={id} window={window} />
            </div>
          </div>

          {/* Reviews & Form */}
          <div className="lg:col-span-2 lg:order-1 space-y-4 sm:space-y-6">
            <ReviewForm dishId={id} />
            <VoiceReviewChat dishId={id} />
            <ReviewFeed reviews={reviews} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { id } = params;
  const summary = await getDishSummary(id, '24h');
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
