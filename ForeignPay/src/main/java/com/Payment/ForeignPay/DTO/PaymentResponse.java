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
public class PaymentResponse {
    private boolean success;
    private Long transactionId;
    private String utr;
    private String merchantName;
    private BigDecimal amount;
    private BigDecimal remainingBalance;
    private String message;
}
