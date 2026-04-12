package com.Payment.ForeignPay.Service;

import com.Payment.ForeignPay.DTO.LoginRequest;
import com.Payment.ForeignPay.DTO.LoginResponse;
import com.Payment.ForeignPay.DTO.RegisterRequest;
import com.Payment.ForeignPay.Entity.Admin;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Enums.KycStatus;
import com.Payment.ForeignPay.Repository.AdminRepository;
import com.Payment.ForeignPay.Repository.UserRepository;
import com.Payment.ForeignPay.Security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AdminRepository adminRepository;

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

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
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

        Optional<Admin> adminOpt = adminRepository.findByEmail(request.getEmail());
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
                throw new RuntimeException("Invalid email or password");
            }
            String token = jwtUtil.generateToken(admin.getEmail(), "ROLE_ADMIN");
            return LoginResponse.builder()
                    .token(token)
                    .userId(admin.getId())
                    .email(admin.getEmail())
                    .fullName("Admin")
                    .role("ADMIN")
                    .kycStatus(null)
                    .walletBalance(null)
                    .build();
        }

        throw new RuntimeException("Invalid email or password");
    }
}
