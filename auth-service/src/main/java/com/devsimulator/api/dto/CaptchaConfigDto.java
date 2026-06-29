package com.devsimulator.api.dto;

import java.util.List;

public record CaptchaConfigDto(
        String provider,
        String siteKey,
        String captchaId,
        String question,
        String kind,
        List<CaptchaTileDto> tiles,
        List<String> sliderMarks
) {
    public static CaptchaConfigDto none() {
        return new CaptchaConfigDto("none", null, null, null, null, null, null);
    }
}
