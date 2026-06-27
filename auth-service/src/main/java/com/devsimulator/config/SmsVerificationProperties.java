package com.devsimulator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sms")
public class SmsVerificationProperties {

    /** Подтверждение номера +7 при регистрации. */
    private boolean enabled = true;

    /** log — код в лог сервера (dev); smsru — SMS.ru; none — без SMS. */
    private String provider = "log";

    private final SmsRu smsru = new SmsRu();

    /** Длина OTP-кода. */
    private int codeLength = 6;

    /** Срок действия кода (минуты). */
    private int ttlMinutes = 10;

    /** Пауза перед повторной отправкой (секунды). */
    private int resendSeconds = 60;

    /** Максимум попыток ввода кода на одну отправку. */
    private int maxAttempts = 5;

    /** Максимум SMS на один номер в сутки. */
    private int maxSendsPerPhonePerDay = 5;

    private String messageTemplate = "Код Career Daily: {code}";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public SmsRu getSmsru() {
        return smsru;
    }

    public int getCodeLength() {
        return codeLength;
    }

    public void setCodeLength(int codeLength) {
        this.codeLength = codeLength;
    }

    public int getTtlMinutes() {
        return ttlMinutes;
    }

    public void setTtlMinutes(int ttlMinutes) {
        this.ttlMinutes = ttlMinutes;
    }

    public int getResendSeconds() {
        return resendSeconds;
    }

    public void setResendSeconds(int resendSeconds) {
        this.resendSeconds = resendSeconds;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public int getMaxSendsPerPhonePerDay() {
        return maxSendsPerPhonePerDay;
    }

    public void setMaxSendsPerPhonePerDay(int maxSendsPerPhonePerDay) {
        this.maxSendsPerPhonePerDay = maxSendsPerPhonePerDay;
    }

    public String getMessageTemplate() {
        return messageTemplate;
    }

    public void setMessageTemplate(String messageTemplate) {
        this.messageTemplate = messageTemplate;
    }

    public boolean isActive() {
        if (!enabled) {
            return false;
        }
        if ("none".equalsIgnoreCase(provider)) {
            return false;
        }
        if ("smsru".equalsIgnoreCase(provider)) {
            return smsru.isConfigured();
        }
        return true;
    }

    public static class SmsRu {
        private String apiId = "";

        public String getApiId() {
            return apiId;
        }

        public void setApiId(String apiId) {
            this.apiId = apiId;
        }

        public boolean isConfigured() {
            return apiId != null && !apiId.isBlank();
        }
    }
}
