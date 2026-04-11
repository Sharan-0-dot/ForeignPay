package com.Payment.ForeignPay.Service;

import com.Payment.ForeignPay.DTO.LoginRequest;
import com.Payment.ForeignPay.DTO.LoginResponse;
import com.Payment.ForeignPay.DTO.RegisterRequest;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Enums.KycStatus;
import com.Payment.ForeignPay.Repository.UserRepository;
import com.Payment.ForeignPay.Security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .country(request.getCountry())
                .phone(request.getPhone())
                .kycStatus(KycStatus.PENDING)
                .walletBalance(BigDecimal.ZERO)
                .currency("INR")
                .build();

        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));


        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), "ROLE_USER");

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role("USER")
                .kycStatus(user.getKycStatus().name())
                .walletBalance(user.getWalletBalance())
                .build();
    }
}
