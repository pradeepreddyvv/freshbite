package com.freshbite.backend.dto;

import java.time.Instant;

public record DishAtRestaurantResponse(
  String id,
  String dishName,
  String cuisine,
  String description,
  Double price,
  String restaurantId,
  String restaurantName,
  Instant createdAt
) {}
