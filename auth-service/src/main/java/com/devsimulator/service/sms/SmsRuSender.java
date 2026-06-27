package com.devsimulator.service.sms;

import com.devsimulator.config.SmsVerificationProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class SmsRuSender implements SmsSender {

    private final SmsVerificationProperties properties;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public SmsRuSender(SmsVerificationProperties properties) {
        this.properties = properties;
    }

    @Override
    public void sendCode(String phoneDigits, String message) {
        if (!properties.getSmsru().isConfigured()) {
            throw new IllegalStateException("SMS.ru API ID не настроен");
        }
        String apiId = properties.getSmsru().getApiId().trim();
        String url = "https://sms.ru/sms/send?api_id=" + encode(apiId)
                + "&to=" + encode(phoneDigits)
                + "&msg=" + encode(message)
                + "&json=1";
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(12))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalArgumentException("SMS-сервис временно недоступен");
            }
            String body = response.body() != null ? response.body() : "";
            if (!body.contains("\"status\":\"OK\"") && !body.contains("\"status_code\":100")) {
                throw new IllegalArgumentException("Не удалось отправить SMS — проверьте номер");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("SMS-сервис временно недоступен");
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
