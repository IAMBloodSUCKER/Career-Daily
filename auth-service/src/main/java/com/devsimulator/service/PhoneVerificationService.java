package com.devsimulator.service;

import com.devsimulator.api.dto.SendPhoneCodeResponse;
import com.devsimulator.config.SmsVerificationProperties;
import com.devsimulator.persistence.repository.AppUserRepository;
import com.devsimulator.service.sms.LogSmsSender;
import com.devsimulator.service.sms.SmsRuSender;
import com.devsimulator.service.sms.SmsSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PhoneVerificationService {

    private static final int MAX_PENDING = 1000;

    private final SmsVerificationProperties properties;
    private final AppUserRepository appUserRepository;
    private final LogSmsSender logSmsSender;
    private final SmsRuSender smsRuSender;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, PendingVerification> pendingById = new ConcurrentHashMap<>();
    private final Map<String, SendStats> sendStatsByPhone = new ConcurrentHashMap<>();

    public PhoneVerificationService(SmsVerificationProperties properties,
                                    AppUserRepository appUserRepository,
                                    LogSmsSender logSmsSender,
                                    SmsRuSender smsRuSender) {
        this.properties = properties;
        this.appUserRepository = appUserRepository;
        this.logSmsSender = logSmsSender;
        this.smsRuSender = smsRuSender;
    }

    public boolean isRequired() {
        return properties.isActive();
    }

    public SendPhoneCodeResponse sendCode(String rawPhone) {
        if (!isRequired()) {
            throw new IllegalArgumentException("Подтверждение телефона отключено");
        }

        String phone = RussianRegistrationPolicy.normalizePhone(rawPhone);
        if (appUserRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Этот номер телефона уже зарегистрирован");
        }

        purgeExpired();
        enforceResendCooldown(phone);
        enforceDailyLimit(phone);

        String code = generateCode();
        String verificationId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.getTtlMinutes() * 60L);
        Instant resendAllowedAt = now.plusSeconds(properties.getResendSeconds());

        pendingById.put(verificationId, new PendingVerification(
                phone, code, expiresAt, resendAllowedAt, 0
        ));
        trimIfNeeded();

        String digits = phone.substring(1);
        String message = properties.getMessageTemplate().replace("{code}", code);
        sender().sendCode(digits, message);
        recordSend(phone);

        String devHint = isLogProvider()
                ? "Код для разработки: " + code + " (см. также лог auth-service)"
                : null;

        return new SendPhoneCodeResponse(
                verificationId,
                properties.getTtlMinutes() * 60,
                properties.getResendSeconds(),
                devHint
        );
    }

    public void verifyForRegistration(String verificationId, String rawPhone, String smsCode) {
        if (!isRequired()) {
            return;
        }
        if (verificationId == null || verificationId.isBlank()) {
            throw new IllegalArgumentException("Сначала получите SMS-код на телефон");
        }
        if (smsCode == null || smsCode.isBlank()) {
            throw new IllegalArgumentException("Введите код из SMS");
        }

        String phone = RussianRegistrationPolicy.normalizePhone(rawPhone);
        PendingVerification pending = pendingById.get(verificationId.trim());
        if (pending == null || pending.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Код устарел — запросите новый");
        }
        if (!pending.phone().equals(phone)) {
            throw new IllegalArgumentException("Номер телефона не совпадает с подтверждённым");
        }
        if (pending.attempts() >= properties.getMaxAttempts()) {
            pendingById.remove(verificationId.trim());
            throw new IllegalArgumentException("Превышено число попыток — запросите новый код");
        }

        pendingById.put(verificationId.trim(), pending.withAttempts(pending.attempts() + 1));

        String normalizedCode = smsCode.trim().replaceAll("\\s", "");
        if (!pending.code().equals(normalizedCode)) {
            throw new IllegalArgumentException("Неверный код из SMS");
        }

        pendingById.remove(verificationId.trim());
    }

    private void enforceResendCooldown(String phone) {
        Instant now = Instant.now();
        for (PendingVerification pending : pendingById.values()) {
            if (!pending.phone().equals(phone)) {
                continue;
            }
            if (pending.resendAllowedAt().isAfter(now)) {
                long seconds = pending.resendAllowedAt().getEpochSecond() - now.getEpochSecond();
                throw new IllegalArgumentException("Повторная отправка через " + Math.max(1, seconds) + " сек.");
            }
        }
    }

    private void enforceDailyLimit(String phone) {
        SendStats stats = sendStatsByPhone.get(phone);
        if (stats == null) {
            return;
        }
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!today.equals(stats.day())) {
            return;
        }
        if (stats.count() >= properties.getMaxSendsPerPhonePerDay()) {
            throw new IllegalArgumentException("Превышен лимит SMS на сегодня для этого номера");
        }
    }

    private void recordSend(String phone) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        sendStatsByPhone.compute(phone, (key, stats) -> {
            if (stats == null || !today.equals(stats.day())) {
                return new SendStats(today, 1);
            }
            return new SendStats(today, stats.count() + 1);
        });
    }

    private SmsSender sender() {
        if ("smsru".equalsIgnoreCase(properties.getProvider())) {
            return smsRuSender;
        }
        return logSmsSender;
    }

    private boolean isLogProvider() {
        return !"smsru".equalsIgnoreCase(properties.getProvider());
    }

    private String generateCode() {
        int length = Math.max(4, Math.min(8, properties.getCodeLength()));
        int bound = (int) Math.pow(10, length);
        int min = bound / 10;
        int value = min + random.nextInt(bound - min);
        return String.valueOf(value);
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        pendingById.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(now));
    }

    private void trimIfNeeded() {
        if (pendingById.size() <= MAX_PENDING) {
            return;
        }
        purgeExpired();
        while (pendingById.size() > MAX_PENDING) {
            String first = pendingById.keySet().iterator().next();
            pendingById.remove(first);
        }
    }

    private record PendingVerification(
            String phone,
            String code,
            Instant expiresAt,
            Instant resendAllowedAt,
            int attempts
    ) {
        PendingVerification withAttempts(int attempts) {
            return new PendingVerification(phone, code, expiresAt, resendAllowedAt, attempts);
        }
    }

    private record SendStats(LocalDate day, int count) {
    }
}
