package com.freshbite.backend.controller;

import com.freshbite.backend.dto.CreateReviewRequest;
import com.freshbite.backend.dto.DishListItemResponse;
import com.freshbite.backend.dto.DishSummaryResponse;
import com.freshbite.backend.dto.ReviewListResponse;
import com.freshbite.backend.dto.ReviewResponse;
import com.freshbite.backend.dto.TimeWindow;
import com.freshbite.backend.service.DishService;
import jakarta.validation.Valid;
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
  private final DishService dishService;

  public DishController(DishService dishService) {
    this.dishService = dishService;
  }

  @GetMapping("/dishes")
  public List<DishListItemResponse> listDishes() {
    return dishService.listRecentDishes();
  }

  @GetMapping("/dish/{id}/summary")
  public DishSummaryResponse getSummary(
    @PathVariable String id,
    @RequestParam(required = false) String window
  ) {
    TimeWindow timeWindow = TimeWindow.from(window, TimeWindow.H24);
    try {
      return dishService.getSummary(id, timeWindow);
    } catch (NoSuchElementException ex) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dish not found");
    }
  }

  @GetMapping("/dish/{id}/reviews")
  public ReviewListResponse getReviews(
    @PathVariable String id,
    @RequestParam(required = false) String window
  ) {
    TimeWindow timeWindow = TimeWindow.from(window, TimeWindow.D5);
    try {
      return dishService.getReviews(id, timeWindow);
    } catch (NoSuchElementException ex) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dish not found");
    }
  }

  @PostMapping("/dish/{id}/reviews")
  public ReviewResponse createReview(
    @PathVariable String id,
    @Valid @RequestBody CreateReviewRequest request
  ) {
    try {
      return dishService.createReview(id, request);
    } catch (NoSuchElementException ex) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dish not found");
    }
  }
}
