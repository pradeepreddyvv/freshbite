package com.freshbite.backend.dto;

public record DishListItemResponse(
  String id,
  String dishName,
  String cuisine,
  String description,
  String restaurantName,
  String city,
  long reviewCount
) {}
