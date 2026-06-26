package com.devsimulator.model;

public record ReplyOption(
        String id,
        String text,
        boolean correct,
        String feedback
) {
}
