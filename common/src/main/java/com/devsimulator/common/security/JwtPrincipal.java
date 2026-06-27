package com.devsimulator.common.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

public class JwtPrincipal {

    private final JwtUserClaims claims;

    public JwtPrincipal(JwtUserClaims claims) {
        this.claims = claims;
    }

    public Long getId() {
        return claims.userId();
    }

    public String getUsername() {
        return claims.username();
    }

    public boolean isAdmin() {
        return claims.admin();
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (claims.admin()) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_USER"),
                    new SimpleGrantedAuthority("ROLE_ADMIN")
            );
        }
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }
}
