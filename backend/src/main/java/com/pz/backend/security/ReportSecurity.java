package com.pz.backend.security;

import com.pz.backend.service.ReportService;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component("reportSecurity")
public class ReportSecurity {

    public boolean canAccessUser(Long userId, Authentication authentication){
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return Objects.equals(jwt.getClaim("user_id"), userId);
    }
}
