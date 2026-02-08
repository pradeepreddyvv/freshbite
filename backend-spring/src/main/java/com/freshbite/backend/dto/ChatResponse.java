package com.freshbite.backend.dto;

import java.util.List;
import java.util.Map;

public record ChatResponse(
  String answer,
  List<String> reviewIdsUsed,
  String window,
  Map<String, Object> metadata
) {}
