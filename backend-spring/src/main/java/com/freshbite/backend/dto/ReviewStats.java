package com.freshbite.backend.dto;

public record ReviewStats(
  Double avgRating,
  int reviewCount,
  String window
) {}
