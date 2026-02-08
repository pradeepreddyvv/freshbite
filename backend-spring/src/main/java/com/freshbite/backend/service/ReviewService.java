package com.freshbite.backend.service;

import com.freshbite.backend.domain.DishAtRestaurant;
import com.freshbite.backend.domain.Review;
import com.freshbite.backend.dto.CreateReviewRequest;
import com.freshbite.backend.dto.ReviewResponse;
import com.freshbite.backend.repository.DishAtRestaurantRepository;
import com.freshbite.backend.repository.ReviewRepository;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {
  private final DishAtRestaurantRepository dishAtRestaurantRepository;
  private final ReviewRepository reviewRepository;

  public ReviewService(DishAtRestaurantRepository dishAtRestaurantRepository, ReviewRepository reviewRepository) {
    this.dishAtRestaurantRepository = dishAtRestaurantRepository;
    this.reviewRepository = reviewRepository;
  }

  public ReviewResponse createReview(String dishAtRestaurantId, CreateReviewRequest request) {
    DishAtRestaurant dishAtRestaurant = dishAtRestaurantRepository.findById(dishAtRestaurantId)
      .orElseThrow();

    Review review = new Review();
    review.setDishAtRestaurant(dishAtRestaurant);
    review.setRating(request.rating());
    review.setText(request.text().trim());
    if (request.visitedAt() != null) {
      review.setVisitedAt(request.visitedAt());
    }

    Review saved = reviewRepository.save(review);

    return new ReviewResponse(
      saved.getId(),
      saved.getRating(),
      saved.getText(),
      saved.getCreatedAt(),
      saved.getVisitedAt(),
      saved.getMealSlot() != null ? saved.getMealSlot().name() : null
    );
  }
}
