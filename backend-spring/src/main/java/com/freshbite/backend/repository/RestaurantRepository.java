package com.freshbite.backend.repository;

import com.freshbite.backend.domain.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, String> {
  List<Restaurant> findAllByOrderByCreatedAtDesc();

  @Query(value = """
    SELECT r.*, 
           (6371 * acos(
             cos(radians(:lat)) * cos(radians(r.latitude)) *
             cos(radians(r.longitude) - radians(:lng)) +
             sin(radians(:lat)) * sin(radians(r.latitude))
           )) AS distance_km
    FROM "Restaurant" r
    WHERE r.latitude IS NOT NULL AND r.longitude IS NOT NULL
      AND (:query = '' OR LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.city) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.address) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.country) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(COALESCE(r.state, '')) LIKE LOWER(CONCAT('%', :query, '%')))
    ORDER BY distance_km ASC
    LIMIT 200
    """, nativeQuery = true)
  List<Object[]> searchNearby(
    @Param("query") String query,
    @Param("lat") double lat,
    @Param("lng") double lng
  );

  @Query(value = """
    SELECT r.*
    FROM "Restaurant" r
    WHERE (:query = '' OR LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.city) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.address) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.country) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(COALESCE(r.state, '')) LIKE LOWER(CONCAT('%', :query, '%')))
    ORDER BY r."createdAt" DESC
    LIMIT 200
    """, nativeQuery = true)
  List<Restaurant> searchByText(@Param("query") String query);
}
