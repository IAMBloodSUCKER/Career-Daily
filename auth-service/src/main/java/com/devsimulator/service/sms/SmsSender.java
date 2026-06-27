package com.devsimulator.service.sms;

public interface SmsSender {

    void sendCode(String phoneDigits, String message);
}
