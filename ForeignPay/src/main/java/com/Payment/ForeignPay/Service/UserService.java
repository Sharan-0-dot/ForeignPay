package com.Payment.ForeignPay.Service;

import com.Payment.ForeignPay.DTO.UserProfileResponse;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .country(user.getCountry())
                .kycStatus(user.getKycStatus().name())
                .walletBalance(user.getWalletBalance())
                .currency(user.getCurrency())
                .build();
    }
}