package com.devsimulator.api.dto;

public record AuthSetupDto(
        boolean devLoginEnabled,
        String adminUsername,
        String hint
) {
}
