package com.freshbite.backend.repository;

import com.freshbite.backend.domain.DishAtRestaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DishAtRestaurantRepository extends JpaRepository<DishAtRestaurant, String> {
  List<DishAtRestaurant> findTop10ByIsActiveTrueOrderByCreatedAtDesc();
  List<DishAtRestaurant> findByRestaurantIdOrderByCreatedAtDesc(String restaurantId);

  @Query(value = """
    SELECT dar.* FROM "DishAtRestaurant" dar
    JOIN "Dish" d ON dar."dishId" = d.id
    JOIN "Restaurant" r ON dar."restaurantId" = r.id
    WHERE dar."isActive" = true
    AND (
      LOWER(d.name) LIKE LOWER(CONCAT('%', :q, '%'))
      OR LOWER(r.name) LIKE LOWER(CONCAT('%', :q, '%'))
      OR LOWER(r.address) LIKE LOWER(CONCAT('%', :q, '%'))
      OR LOWER(r.city) LIKE LOWER(CONCAT('%', :q, '%'))
      OR LOWER(COALESCE(d.cuisine, '')) LIKE LOWER(CONCAT('%', :q, '%'))
    )
    ORDER BY dar."createdAt" DESC
    LIMIT 50
    """, nativeQuery = true)
  List<DishAtRestaurant> searchByQuery(@Param("q") String query);
}
