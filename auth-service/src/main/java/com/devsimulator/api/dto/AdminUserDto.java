package com.devsimulator.api.dto;

import java.time.Instant;

public record AdminUserDto(
        Long id,
        String username,
        String displayName,
        boolean admin,
        boolean hasSave,
        String saveSummary,
        Instant createdAt
) {
}
