package com.freshbite.backend.dto;

import java.time.Instant;

public record ReviewResponse(
  String id,
  int rating,
  String text,
  Instant createdAt,
  Instant visitedAt,
  String mealSlot
) {}
