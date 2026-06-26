package com.devsimulator.api.dto;

public record NewsItemDto(
        String id,
        String title,
        String url,
        String source,
        String publishedAt,
        String category,
        boolean internal
) {
}
