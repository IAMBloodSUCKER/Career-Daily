package com.devsimulator.security;

import com.devsimulator.common.security.JwtPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof AppUserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        if (principal instanceof JwtPrincipal jwtPrincipal) {
            return jwtPrincipal.getId();
        }
        throw new IllegalStateException("Unexpected principal type");
    }

    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth != null ? auth.getPrincipal() : null;
        return auth != null && auth.isAuthenticated()
                && (principal instanceof AppUserPrincipal || principal instanceof JwtPrincipal);
    }

    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        Object principal = auth.getPrincipal();
        if (principal instanceof AppUserPrincipal userPrincipal) {
            return userPrincipal.isAdmin();
        }
        if (principal instanceof JwtPrincipal jwtPrincipal) {
            return jwtPrincipal.isAdmin();
        }
        return false;
    }
}
