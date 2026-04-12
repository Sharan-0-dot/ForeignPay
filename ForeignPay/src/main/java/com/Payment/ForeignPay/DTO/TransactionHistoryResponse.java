package com.Payment.ForeignPay.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryResponse {
    private Long id;
    private String merchantName;
    private String merchantUpiId;
    private BigDecimal amount;
    private String category;
    private String utr;
    private String status;
    private LocalDateTime createdAt;
}
