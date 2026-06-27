package com.devsimulator.common.security;

public record JwtUserClaims(Long userId, String username, boolean admin) {
}
