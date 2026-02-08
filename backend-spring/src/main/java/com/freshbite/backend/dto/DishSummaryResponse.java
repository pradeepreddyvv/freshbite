package com.freshbite.backend.dto;

public record DishSummaryResponse(
  DishSummaryResponse.DishInfo dish,
  DishSummaryResponse.RestaurantInfo restaurant,
  ReviewStats stats,
  RiskLabel risk
) {
  public record DishInfo(
    String id,
    String name,
    String cuisine,
    String description,
    Double price
  ) {}

  public record RestaurantInfo(
    String name,
    String address,
    String city
  ) {}
}
