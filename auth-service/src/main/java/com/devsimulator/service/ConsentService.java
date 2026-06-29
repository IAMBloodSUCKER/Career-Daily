package com.devsimulator.service;

import com.devsimulator.config.LegalProperties;
import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.entity.UserConsentLog;
import com.devsimulator.persistence.repository.UserConsentLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ConsentService {

    private final LegalProperties legalProperties;
    private final UserConsentLogRepository consentLogRepository;

    public ConsentService(LegalProperties legalProperties, UserConsentLogRepository consentLogRepository) {
        this.legalProperties = legalProperties;
        this.consentLogRepository = consentLogRepository;
    }

    @Transactional
    public void recordRegistrationConsent(AppUser user, String ipAddress, String userAgent) {
        Instant now = Instant.now();
        String policyVersion = legalProperties.getPolicyVersion();
        String termsVersion = legalProperties.getTermsVersion();

        user.setPdConsentAt(now);
        user.setPdConsentVersion(policyVersion);
        user.setTermsAcceptedAt(now);
        user.setTermsVersion(termsVersion);

        consentLogRepository.save(new UserConsentLog(
                user, UserConsentLog.TYPE_PD_CONSENT, policyVersion, ipAddress, userAgent));
        consentLogRepository.save(new UserConsentLog(
                user, UserConsentLog.TYPE_TERMS, termsVersion, ipAddress, userAgent));
    }
}
