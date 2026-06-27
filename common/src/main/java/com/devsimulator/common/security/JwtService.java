package com.devsimulator.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        byte[] bytes = properties.getSecret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 0, bytes.length);
            bytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String createToken(long userId, String username, boolean admin) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(properties.getExpirationHours() * 3600);
        return Jwts.builder()
                .subject(Long.toString(userId))
                .claim("username", username)
                .claim("admin", admin)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Optional<JwtUserClaims> parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            long userId = Long.parseLong(claims.getSubject());
            String username = claims.get("username", String.class);
            Boolean admin = claims.get("admin", Boolean.class);
            return Optional.of(new JwtUserClaims(userId, username, Boolean.TRUE.equals(admin)));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
