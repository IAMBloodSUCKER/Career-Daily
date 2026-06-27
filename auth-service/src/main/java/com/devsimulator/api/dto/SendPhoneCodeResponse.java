package com.devsimulator.api.dto;

public record SendPhoneCodeResponse(
        String verificationId,
        int expiresInSeconds,
        int resendAfterSeconds,
        String devHint
) {
}
