package com.freshbite.backend.service;

import com.freshbite.backend.dto.RiskLabel;

public class RiskLabelCalculator {
  private RiskLabelCalculator() {
  }

  public static RiskLabel calculate(Double avgRating, int reviewCount) {
    if (reviewCount < 3 || avgRating == null) {
      return new RiskLabel("no-data", "Not enough data", "⚪", "text-gray-600", "bg-gray-100");
    }
    if (avgRating >= 4.0) {
      return new RiskLabel("good", "Good today", "🟢", "text-green-700", "bg-green-100");
    }
    if (avgRating >= 3.0) {
      return new RiskLabel("mixed", "Mixed today", "🟡", "text-yellow-700", "bg-yellow-100");
    }
    return new RiskLabel("risky", "Risky today", "🔴", "text-red-700", "bg-red-100");
  }
}
