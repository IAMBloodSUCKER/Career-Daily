package com.devsimulator.api.dto;

public record AuthUserDto(
        Long id,
        String username,
        String email,
        String displayName,
        boolean admin
) {
}
