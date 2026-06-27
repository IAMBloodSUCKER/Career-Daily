package com.devsimulator.api.dto;

import java.time.Instant;

public record AdminUserDto(
        Long id,
        String username,
        String email,
        String phone,
        String displayName,
        boolean admin,
        boolean hasSave,
        String saveSummary,
        Instant createdAt
) {
}
