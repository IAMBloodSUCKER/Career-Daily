package com.devsimulator.api.dto;

public record CaptchaConfigDto(
        String provider,
        String siteKey,
        String captchaId,
        String question
) {
    public static CaptchaConfigDto none() {
        return new CaptchaConfigDto("none", null, null, null);
    }
}
