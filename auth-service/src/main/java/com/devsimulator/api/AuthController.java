package com.devsimulator.api;

import com.devsimulator.api.dto.AuthResponseDto;
import com.devsimulator.api.dto.AuthUserDto;
import com.devsimulator.api.dto.CaptchaConfigDto;
import com.devsimulator.api.dto.DeleteAccountRequest;
import com.devsimulator.api.dto.LegalConfigDto;
import com.devsimulator.api.dto.LoginRequest;
import com.devsimulator.api.dto.RegisterRequest;
import com.devsimulator.common.security.JwtService;
import com.devsimulator.persistence.repository.AppUserRepository;
import com.devsimulator.security.AppUserPrincipal;
import com.devsimulator.security.SecurityUtils;
import com.devsimulator.service.AccountService;
import com.devsimulator.service.AuthService;
import com.devsimulator.service.CaptchaService;
import com.devsimulator.service.LegalService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AccountService accountService;
    private final LegalService legalService;
    private final CaptchaService captchaService;
    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final JwtService jwtService;

    public AuthController(AuthService authService,
                          AccountService accountService,
                          LegalService legalService,
                          CaptchaService captchaService,
                          AuthenticationManager authenticationManager,
                          AppUserRepository appUserRepository,
                          JwtService jwtService) {
        this.authService = authService;
        this.accountService = accountService;
        this.legalService = legalService;
        this.captchaService = captchaService;
        this.authenticationManager = authenticationManager;
        this.appUserRepository = appUserRepository;
        this.jwtService = jwtService;
    }

    @GetMapping("/captcha-config")
    public CaptchaConfigDto captchaConfig() {
        return captchaService.configForRegistration();
    }

    @GetMapping("/legal-config")
    public LegalConfigDto legalConfig() {
        return legalService.publicConfig();
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequest request,
                                                      HttpServletRequest httpRequest) {
        captchaService.verifyRegistration(request, httpRequest.getRemoteAddr());
        authService.register(request, httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username().trim(), request.password())
        );
        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(toAuthResponse(principal));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        AuthService.normalizeLogin(request),
                        request.password()
                )
        );
        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(toAuthResponse(principal));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(@Valid @RequestBody DeleteAccountRequest request) {
        accountService.deleteOwnAccount(request.password());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserDto> me() {
        if (!SecurityUtils.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        Long userId = SecurityUtils.currentUserId();
        return appUserRepository.findById(userId)
                .map(user -> ResponseEntity.ok(new AuthUserDto(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getDisplayName(),
                        user.isAdmin()
                )))
                .orElse(ResponseEntity.status(401).build());
    }

    private AuthResponseDto toAuthResponse(AppUserPrincipal principal) {
        AuthUserDto user = authService.toDto(principal);
        String token = jwtService.createToken(user.id(), user.username(), user.admin());
        return new AuthResponseDto(token, user);
    }
}
