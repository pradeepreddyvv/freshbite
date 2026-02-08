package com.freshbite.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDishAtRestaurantRequest(
  @NotBlank String dishName,
  String cuisine,
  String description,
  Double price
) {}
