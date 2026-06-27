package com.devsimulator.model;

public record TeamMemberIntro(
        String id,
        String name,
        String role,
        String avatar,
        String bio,
        String greeting
) {
}
