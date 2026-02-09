package com.freshbite.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  private final String webOrigin;

  public WebConfig(@Value("${app.web-origin}") String webOrigin) {
    this.webOrigin = webOrigin;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    var mapping = registry.addMapping("/api/**")
      .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
      .allowedHeaders("*");

    if ("*".equals(webOrigin.trim())) {
      // Allow all origins (dev/testing) — uses patterns to stay compatible with credentials
      mapping.allowedOriginPatterns("*")
             .allowCredentials(false);
    } else {
      // Production: explicit comma-separated origins
      mapping.allowedOrigins(webOrigin.split(","))
             .allowCredentials(true);
    }
  }
}
