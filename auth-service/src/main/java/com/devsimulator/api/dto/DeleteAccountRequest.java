package com.devsimulator.api.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank(message = "Укажите пароль для подтверждения")
        String password
) {
}
