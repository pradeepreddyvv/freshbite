package com.freshbite.backend.dto;

import java.time.Instant;

public record RestaurantResponse(
  String id,
  String name,
  String address,
  String city,
  String state,
  String country,
  Double latitude,
  Double longitude,
  Instant createdAt
) {}
