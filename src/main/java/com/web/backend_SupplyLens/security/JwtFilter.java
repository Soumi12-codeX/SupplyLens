package com.web.backend_SupplyLens.security;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

//@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

        public JwtFilter(JwtService jwtService) {
            this.jwtService = jwtService;
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

                List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(username, null,
                        authorities);

                SecurityContextHolder.getContext().setAuthentication(authToken);
            } catch (Exception e) {
                // Log the exception if needed
                System.out.println("JWT validation failed: " + e.getMessage());
            }

            filterChain.doFilter(request, response);
        }
}
