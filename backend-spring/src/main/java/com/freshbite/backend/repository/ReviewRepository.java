package com.freshbite.backend.repository;

import com.freshbite.backend.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {
  List<Review> findByDishAtRestaurantIdAndCreatedAtAfterOrderByCreatedAtDesc(String dishAtRestaurantId, Instant cutoff);
  List<Review> findByDishAtRestaurantIdAndCreatedAtAfter(String dishAtRestaurantId, Instant cutoff);
  long countByDishAtRestaurantId(String dishAtRestaurantId);
}
