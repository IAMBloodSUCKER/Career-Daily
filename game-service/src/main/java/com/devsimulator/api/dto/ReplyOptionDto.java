package com.devsimulator.api.dto;

import com.devsimulator.model.ReplyOption;

public record ReplyOptionDto(String id, String text) {
    public static ReplyOptionDto from(ReplyOption r) {
        return new ReplyOptionDto(r.id(), r.text());
    }
}
