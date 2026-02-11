package com.freshbite.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateRestaurantRequest(
  @NotBlank String name,
  String address,
  String city,
  String state,
  String country,
  String timezone,
  Double latitude,
  Double longitude
) {}
