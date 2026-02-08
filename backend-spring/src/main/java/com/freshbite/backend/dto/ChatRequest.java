package com.freshbite.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
  @NotBlank String dishAtRestaurantId,
  @NotBlank String question,
  String window
) {}
