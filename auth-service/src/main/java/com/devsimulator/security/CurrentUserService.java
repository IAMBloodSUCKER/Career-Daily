package com.devsimulator.security;

import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.repository.AppUserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final AppUserRepository appUserRepository;

    public CurrentUserService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public AppUser requireCurrentUser() {
        return appUserRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }
}
