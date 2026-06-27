package com.devsimulator.security;

import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    public Long requireCurrentUserId() {
        return SecurityUtils.currentUserId();
    }
}
