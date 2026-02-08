package com.freshbite.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "\"DishAtRestaurant\"")
public class DishAtRestaurant {
  @Id
  @Column(name = "id")
  private String id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "\"restaurantId\"")
  private Restaurant restaurant;

  @ManyToOne(optional = false)
  @JoinColumn(name = "\"dishId\"")
  private Dish dish;

  private Double price;

  @Column(name = "\"isActive\"", nullable = false)
  private boolean isActive = true;

  @CreationTimestamp
  @Column(name = "\"createdAt\"")
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "\"updatedAt\"")
  private Instant updatedAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public Restaurant getRestaurant() {
    return restaurant;
  }

  public void setRestaurant(Restaurant restaurant) {
    this.restaurant = restaurant;
  }

  public Dish getDish() {
    return dish;
  }

  public void setDish(Dish dish) {
    this.dish = dish;
  }

  public Double getPrice() {
    return price;
  }

  public void setPrice(Double price) {
    this.price = price;
  }

  public boolean isActive() {
    return isActive;
  }

  public void setActive(boolean active) {
    isActive = active;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
