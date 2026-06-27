package com.devsimulator.api.dto;

public record AuthResponseDto(
        String token,
        AuthUserDto user
) {
}
