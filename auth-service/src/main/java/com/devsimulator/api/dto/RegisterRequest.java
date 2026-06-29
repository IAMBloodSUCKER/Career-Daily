package com.devsimulator.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 64) String username,
        @NotBlank @Size(min = 6, max = 128) String password,
        @NotBlank @Size(min = 2, max = 128) String displayName,
        @NotNull(message = "Необходимо согласие на обработку персональных данных")
        Boolean personalDataConsent,
        @NotNull(message = "Необходимо принять пользовательское соглашение")
        Boolean termsAccepted,
        String policyVersion,
        String termsVersion,
        String smartCaptchaToken,
        String captchaId,
        String captchaAnswer
) {
}
