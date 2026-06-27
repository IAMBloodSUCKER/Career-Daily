package com.devsimulator.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Укажите номер телефона +7")
        String phone,
        @Size(max = 255) String email,
        @NotBlank @Size(min = 3, max = 64) String username,
        @NotBlank @Size(min = 6, max = 128) String password,
        @NotBlank @Size(min = 2, max = 128) String displayName,
        @NotNull(message = "Необходимо согласие на обработку персональных данных")
        Boolean personalDataConsent,
        String smartCaptchaToken,
        String captchaId,
        String captchaAnswer,
        String smsVerificationId,
        String smsCode
) {
}
