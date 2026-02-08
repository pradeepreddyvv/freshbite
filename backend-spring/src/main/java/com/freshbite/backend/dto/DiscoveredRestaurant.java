package com.freshbite.backend.dto;

/**
 * A restaurant discovered from OpenStreetMap (not yet in our DB).
 */
public record DiscoveredRestaurant(
  long osmId,
  String name,
  String cuisine,
  String address,
  String city,
  String state,
  String country,
  String phone,
  String website,
  String openingHours,
  String type,        // "restaurant", "fast_food", "cafe"
  double latitude,
  double longitude,
  Double distanceKm,  // distance from search center (null if no user location)
  String source,       // "osm" for OpenStreetMap, "freshbite" for our DB
  String freshbiteId   // FreshBite DB id (non-null for source=freshbite, null for OSM)
) {}
