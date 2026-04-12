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
public class TopupVerifyResponse {
    private boolean success;
    private BigDecimal creditedInr;
    private BigDecimal newBalance;
    private Long transactionId;
}
