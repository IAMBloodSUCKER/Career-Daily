package com.devsimulator.service.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LogSmsSender implements SmsSender {

    private static final Logger log = LoggerFactory.getLogger(LogSmsSender.class);

    @Override
    public void sendCode(String phoneDigits, String message) {
        log.info("[SMS dev] to +{} — {}", phoneDigits, message);
    }
}
