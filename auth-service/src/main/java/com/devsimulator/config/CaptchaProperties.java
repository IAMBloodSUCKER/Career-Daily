package com.devsimulator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.captcha")
public class CaptchaProperties {

    /** Включить проверку капчи при регистрации. */
    private boolean enabled = true;

    /** internal — своя задача; yandex — Yandex SmartCaptcha; none — выкл. */
    private String provider = "internal";

    private final Yandex yandex = new Yandex();

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

    public Yandex getYandex() {
        return yandex;
    }

    public static class Yandex {
        private String clientKey = "";
        private String serverKey = "";

        public String getClientKey() {
            return clientKey;
        }

        public void setClientKey(String clientKey) {
            this.clientKey = clientKey;
        }

        public String getServerKey() {
            return serverKey;
        }

        public void setServerKey(String serverKey) {
            this.serverKey = serverKey;
        }

        public boolean isConfigured() {
            return clientKey != null && !clientKey.isBlank()
                    && serverKey != null && !serverKey.isBlank();
        }
    }
}
