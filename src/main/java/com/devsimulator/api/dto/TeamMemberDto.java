package com.devsimulator.api.dto;

import com.devsimulator.model.TeamMemberIntro;

public record TeamMemberDto(String id, String name, String role, String avatar, String bio, String greeting) {
    public static TeamMemberDto from(TeamMemberIntro member) {
        return new TeamMemberDto(
                member.id(),
                member.name(),
                member.role(),
                member.avatar(),
                member.bio(),
                member.greeting()
        );
    }
}
