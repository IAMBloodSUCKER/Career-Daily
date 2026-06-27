package com.devsimulator.api.dto;

import java.util.List;

public record PortalNewsDto(
        List<NewsItemDto> internal,
        List<NewsItemDto> external,
        String cachedAt,
        boolean offline,
        String disclaimer
) {
}
