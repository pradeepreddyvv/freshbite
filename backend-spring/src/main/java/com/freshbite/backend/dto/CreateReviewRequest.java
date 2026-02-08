package com.freshbite.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record CreateReviewRequest(
  @Min(1) @Max(5) int rating,
  @NotBlank String text,
  Instant visitedAt  // optional: when the user actually ate there
) {}
