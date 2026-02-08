package com.freshbite.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "\"Review\"")
public class Review {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id")
  private String id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "\"dishAtRestaurantId\"")
  private DishAtRestaurant dishAtRestaurant;

  @Column(nullable = false)
  private int rating;

  @Column(nullable = false, length = 1000)
  private String text;

  @CreationTimestamp
  @Column(name = "\"createdAt\"")
  private Instant createdAt;

  @Column(name = "\"visitedAt\"")
  private Instant visitedAt;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "\"mealSlot\"")
  private MealSlot mealSlot;

  public String getId() {
    return id;
  }

  public DishAtRestaurant getDishAtRestaurant() {
    return dishAtRestaurant;
  }

  public void setDishAtRestaurant(DishAtRestaurant dishAtRestaurant) {
    this.dishAtRestaurant = dishAtRestaurant;
  }

  public int getRating() {
    return rating;
  }

  public void setRating(int rating) {
    this.rating = rating;
  }

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = text;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getVisitedAt() {
    return visitedAt;
  }

  public void setVisitedAt(Instant visitedAt) {
    this.visitedAt = visitedAt;
  }

  public MealSlot getMealSlot() {
    return mealSlot;
  }

  public void setMealSlot(MealSlot mealSlot) {
    this.mealSlot = mealSlot;
  }
}
