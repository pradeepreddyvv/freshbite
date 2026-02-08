package com.freshbite.backend.service;

import com.freshbite.backend.domain.DishAtRestaurant;
import com.freshbite.backend.domain.Review;
import com.freshbite.backend.dto.CreateReviewRequest;
import com.freshbite.backend.dto.DishListItemResponse;
import com.freshbite.backend.dto.DishSummaryResponse;
import com.freshbite.backend.dto.ReviewListResponse;
import com.freshbite.backend.dto.ReviewResponse;
import com.freshbite.backend.dto.ReviewStats;
import com.freshbite.backend.dto.TimeWindow;
import com.freshbite.backend.repository.DishAtRestaurantRepository;
import com.freshbite.backend.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class DishService {
  private final DishAtRestaurantRepository dishAtRestaurantRepository;
  private final ReviewRepository reviewRepository;

  public DishService(DishAtRestaurantRepository dishAtRestaurantRepository, ReviewRepository reviewRepository) {
    this.dishAtRestaurantRepository = dishAtRestaurantRepository;
    this.reviewRepository = reviewRepository;
  }

  public List<DishListItemResponse> listRecentDishes() {
    return dishAtRestaurantRepository.findTop10ByIsActiveTrueOrderByCreatedAtDesc()
      .stream()
      .map(this::toDishListItem)
      .toList();
  }

  public DishSummaryResponse getSummary(String dishAtRestaurantId, TimeWindow window) {
    DishAtRestaurant dishAtRestaurant = dishAtRestaurantRepository.findById(dishAtRestaurantId)
      .orElseThrow();

    Instant cutoff = window.cutoff(Instant.now());
    List<Review> reviews = reviewRepository.findByDishAtRestaurantIdAndCreatedAtAfter(dishAtRestaurantId, cutoff);

    ReviewStats stats = calculateStats(reviews, window);

    return new DishSummaryResponse(
      new DishSummaryResponse.DishInfo(
        dishAtRestaurant.getId(),
        dishAtRestaurant.getDish().getName(),
        dishAtRestaurant.getDish().getCuisine(),
        dishAtRestaurant.getDish().getDescription(),
        dishAtRestaurant.getPrice()
      ),
      new DishSummaryResponse.RestaurantInfo(
        dishAtRestaurant.getRestaurant().getName(),
        dishAtRestaurant.getRestaurant().getAddress(),
        dishAtRestaurant.getRestaurant().getCity()
      ),
      stats,
      RiskLabelCalculator.calculate(stats.avgRating(), stats.reviewCount())
    );
  }

  public ReviewListResponse getReviews(String dishAtRestaurantId, TimeWindow window) {
    DishAtRestaurant dishAtRestaurant = dishAtRestaurantRepository.findById(dishAtRestaurantId)
      .orElseThrow();

    Instant cutoff = window.cutoff(Instant.now());
    List<Review> reviews = reviewRepository.findByDishAtRestaurantIdAndCreatedAtAfterOrderByCreatedAtDesc(
      dishAtRestaurantId,
      cutoff
    );

    ReviewStats stats = calculateStats(reviews, window);

    return new ReviewListResponse(
      reviews.stream().map(this::toReviewResponse).toList(),
      stats
    );
  }

  public ReviewResponse createReview(String dishAtRestaurantId, CreateReviewRequest request) {
      DishAtRestaurant dishAtRestaurant = dishAtRestaurantRepository.findById(dishAtRestaurantId)
        .orElseThrow();

      Review review = new Review();
      review.setDishAtRestaurant(dishAtRestaurant);
      review.setRating(request.rating());
      review.setText(request.text());
      if (request.visitedAt() != null) {
        review.setVisitedAt(request.visitedAt());
      }

      Review saved = reviewRepository.save(review);
      return toReviewResponse(saved);
    }
  private DishListItemResponse toDishListItem(DishAtRestaurant item) {
    long reviewCount = reviewRepository.countByDishAtRestaurantId(item.getId());
    return new DishListItemResponse(
      item.getId(),
      item.getDish().getName(),
      item.getDish().getCuisine(),
      item.getDish().getDescription(),
      item.getRestaurant().getName(),
      item.getRestaurant().getCity(),
      reviewCount
    );
  }

  private ReviewResponse toReviewResponse(Review review) {
    String mealSlot = review.getMealSlot() != null ? review.getMealSlot().name() : null;
    return new ReviewResponse(
      review.getId(),
      review.getRating(),
      review.getText(),
      review.getCreatedAt(),
      review.getVisitedAt(),
      mealSlot
    );
  }

  private ReviewStats calculateStats(List<Review> reviews, TimeWindow window) {
    int reviewCount = reviews.size();
    Double avgRating = reviewCount > 0
      ? reviews.stream().mapToInt(Review::getRating).average().orElse(0.0)
      : null;

    Double rounded = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null;

    return new ReviewStats(rounded, reviewCount, window.getValue());
  }
}
