package com.Payment.ForeignPay.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long userId;
    private String email;
    private String fullName;
    private String role;
    private String kycStatus;
    private BigDecimal walletBalance;
}
