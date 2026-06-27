package com.devsimulator.common.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    private String secret = "change-me-in-production-career-daily-jwt-secret-key-32chars";
    private long expirationHours = 72;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationHours() {
        return expirationHours;
    }

    public void setExpirationHours(long expirationHours) {
        this.expirationHours = expirationHours;
    }
}
