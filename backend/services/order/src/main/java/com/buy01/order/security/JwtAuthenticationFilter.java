package com.buy01.order.security;

import com.buy01.order.util.JwtUtil;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;

import java.util.Collections;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = authorizationHeader.substring(7);

            if (jwtUtil.isTokenValid(jwt)) {
                String email = jwtUtil.extractEmail(jwt);
                String role = jwtUtil.extractRole(jwt);
                String id = jwtUtil.extractId(jwt);

                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            email,
                            id, // credentials = userId (for ownership checks)
                            Collections.singletonList(new SimpleGrantedAuthority(role)));
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } else {
                SecurityConfig.writeJsonError(response, HttpStatus.UNAUTHORIZED,
                        "Invalid or expired token", "Please login again", request.getRequestURI());
                return;
            }

            filterChain.doFilter(request, response);

        } catch (SignatureException e) {
            SecurityConfig.writeJsonError(response, HttpStatus.UNAUTHORIZED,
                    "Invalid signature", "The token has been tampered", request.getRequestURI());
        } catch (ExpiredJwtException e) {
            SecurityConfig.writeJsonError(response, HttpStatus.UNAUTHORIZED,
                    "Session expired", "Your session has expired. Please log in again.", request.getRequestURI());
        } catch (MalformedJwtException e) {
            SecurityConfig.writeJsonError(response, HttpStatus.BAD_REQUEST,
                    "Malformed token", "The token format is invalid", request.getRequestURI());
        } catch (Exception e) {
            SecurityConfig.writeJsonError(response, HttpStatus.UNAUTHORIZED,
                    "Authentication error", "An error occurred during authentication", request.getRequestURI());
        }
    }
}
