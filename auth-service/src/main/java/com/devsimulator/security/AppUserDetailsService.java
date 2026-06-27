package com.devsimulator.security;

import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.repository.AppUserRepository;
import com.devsimulator.service.RussianRegistrationPolicy;
import java.util.Optional;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository appUserRepository;

    public AppUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = appUserRepository.findByUsernameIgnoreCase(username)
                .or(() -> appUserRepository.findByEmailIgnoreCase(username))
                .or(() -> {
                    if (RussianRegistrationPolicy.looksLikePhone(username)) {
                        return appUserRepository.findByPhone(
                                RussianRegistrationPolicy.normalizePhone(username));
                    }
                    return Optional.empty();
                })
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new AppUserPrincipal(user);
    }
}
