package com.devsimulator.api.dto;

import jakarta.validation.constraints.NotBlank;

public record SendPhoneCodeRequest(
        @NotBlank(message = "Укажите номер телефона +7")
        String phone
) {
}
