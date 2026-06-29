package com.devsimulator.service;

import com.devsimulator.api.dto.LegalConfigDto;
import com.devsimulator.config.LegalProperties;
import org.springframework.stereotype.Service;

@Service
public class LegalService {

    private final LegalProperties legalProperties;

    public LegalService(LegalProperties legalProperties) {
        this.legalProperties = legalProperties;
    }

    public LegalConfigDto publicConfig() {
        return new LegalConfigDto(
                legalProperties.getOperatorName(),
                blankToNull(legalProperties.getOperatorInn()),
                blankToNull(legalProperties.getOperatorOgrn()),
                legalProperties.getOperatorAddress(),
                legalProperties.operatorRequisitesLine(),
                legalProperties.getPrivacyEmail(),
                legalProperties.getSupportEmail(),
                legalProperties.getSiteUrl(),
                legalProperties.getPolicyVersion(),
                legalProperties.getTermsVersion()
        );
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
