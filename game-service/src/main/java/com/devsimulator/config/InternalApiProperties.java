package com.devsimulator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.internal")
public class InternalApiProperties {

    private String token = "dev-internal-token";

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
