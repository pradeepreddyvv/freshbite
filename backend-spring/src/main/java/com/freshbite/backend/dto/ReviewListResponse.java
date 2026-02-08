package com.freshbite.backend.dto;

import java.util.List;

public record ReviewListResponse(
  List<ReviewResponse> reviews,
  ReviewStats stats
) {}
