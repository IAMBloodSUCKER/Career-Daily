package com.devsimulator.api.dto;

public record LegalConfigDto(
        String operatorName,
        String operatorInn,
        String operatorOgrn,
        String operatorAddress,
        String operatorRequisites,
        String privacyEmail,
        String supportEmail,
        String siteUrl,
        String policyVersion,
        String termsVersion
) {
}
