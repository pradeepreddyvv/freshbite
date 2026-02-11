package com.freshbite.backend.controller;

import com.freshbite.backend.dto.CreateReviewRequest;
import com.freshbite.backend.dto.DishListItemResponse;
import com.freshbite.backend.dto.DishSummaryResponse;
import com.freshbite.backend.dto.ReviewListResponse;
import com.freshbite.backend.dto.ReviewResponse;
import com.freshbite.backend.dto.TimeWindow;
import com.freshbite.backend.service.DishService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api")
public class DishController {
  private static final Logger log = LoggerFactory.getLogger(DishController.class);
  private final DishService dishService;

  public DishController(DishService dishService) {
    this.dishService = dishService;
  }

  @GetMapping("/dishes")
  public List<DishListItemResponse> listDishes() {
    log.info("GET /api/dishes");
    long start = System.currentTimeMillis();
    List<DishListItemResponse> dishes = dishService.listRecentDishes();
    log.info("GET /api/dishes completed count={} duration={}ms", dishes.size(), System.currentTimeMillis() - start);
    return dishes;
  }

  @GetMapping("/dish/{id}/summary")
  public DishSummaryResponse getSummary(
    @PathVariable String id,
    @RequestParam(required = false) String window
  ) {
    TimeWindow timeWindow = TimeWindow.from(window, TimeWindow.H24);
    log.info("GET /api/dish/{}/summary window={}", id, timeWindow.getValue());
    long start = System.currentTimeMillis();
    try {
      DishSummaryResponse summary = dishService.getSummary(id, timeWindow);
      log.info("GET /api/dish/{}/summary completed risk={} avgRating={} reviewCount={} duration={}ms",
        id, summary.risk().level(), summary.stats().avgRating(), summary.stats().reviewCount(),
        System.currentTimeMillis() - start);
      return summary;
    } catch (NoSuchElementException ex) {
      log.warn("GET /api/dish/{}/summary NOT_FOUND duration={}ms", id, System.currentTimeMillis() - start);
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dish not found");
    }
  }

  @GetMapping("/dish/{id}/reviews")
  public ReviewListResponse getReviews(
    @PathVariable String id,
    @RequestParam(required = false) String window
  ) {
    TimeWindow timeWindow = TimeWindow.from(window, TimeWindow.D5);
    log.info("GET /api/dish/{}/reviews window={}", id, timeWindow.getValue());
    long start = System.currentTimeMillis();
    try {
      ReviewListResponse reviews = dishService.getReviews(id, timeWindow);
      log.info("GET /api/dish/{}/reviews completed count={} duration={}ms",
        id, reviews.reviews().size(), System.currentTimeMillis() - start);
      return reviews;
    } catch (NoSuchElementException ex) {
      log.warn("GET /api/dish/{}/reviews NOT_FOUND duration={}ms", id, System.currentTimeMillis() - start);
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dish not found");
    }
  }

  @PostMapping("/dish/{id}/reviews")
  public ReviewResponse createReview(
    @PathVariable String id,
    @Valid @RequestBody CreateReviewRequest request
  ) {
    log.info("POST /api/dish/{}/reviews rating={} textLength={}", id, request.rating(), request.text().length());
    long start = System.currentTimeMillis();
    try {
      ReviewResponse review = dishService.createReview(id, request);
      log.info("POST /api/dish/{}/reviews completed reviewId={} duration={}ms",
        id, review.id(), System.currentTimeMillis() - start);
      return review;
    } catch (NoSuchElementException ex) {
      log.warn("POST /api/dish/{}/reviews NOT_FOUND duration={}ms", id, System.currentTimeMillis() - start);
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dish not found");
    } catch (Exception e) {
      log.error("POST /api/dish/{}/reviews FAILED error={} duration={}ms", id, e.getMessage(), System.currentTimeMillis() - start, e);
      throw e;
    }
  }
}
