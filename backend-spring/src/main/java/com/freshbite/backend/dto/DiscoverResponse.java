package com.freshbite.backend.dto;

import java.util.List;

/**
 * Response for the /api/discover endpoint.
 * Contains the resolved location and discovered restaurants.
 */
public record DiscoverResponse(
  String resolvedLocation,    // e.g., "Phoenix, Arizona, USA"
  Double centerLat,
  Double centerLng,
  int totalResults,
  List<DiscoveredRestaurant> restaurants
) {}
