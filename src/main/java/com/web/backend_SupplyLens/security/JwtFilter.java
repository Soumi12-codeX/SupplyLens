package com.web.backend_SupplyLens.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.web.backend_SupplyLens.model.User;
import com.web.backend_SupplyLens.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final UserRepository userRepo;

    public JwtFilter(JwtService jwtService, UserRepository userRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        System.out.println(">>> FILTER CHECK - Path: " + path);
        boolean skip = path.startsWith("/api/auth") || path.startsWith("/api/alerts/from-python");
        System.out.println(">>> SKIPPING FILTER: " + skip);
        return skip;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println(">>> FILTER RUNNING for: " + request.getRequestURI());
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);
            if (role != null) role = role.toUpperCase();

            System.out.println(">>> AUTH: Token extracted. User: " + username + ", Role: " + role);

            User user = userRepo.findByEmail(username).orElse(null);
            
            if (user == null) {
                user = userRepo.findByDriverId(username).orElse(null);
            }

            if (user != null) {
                List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(user, null,
                        authorities);

                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println(">>> AUTH SUCCESS: Security context set for: " + username);
            } else {
                System.err.println(">>> AUTH FAILURE: User '" + username + "' not found in DB!");
            }
        } catch (Exception e) {
            System.err.println(">>> AUTH ERROR: JWT Validation failed: " + e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
