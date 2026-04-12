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
public class TopupOrderResponse {
    private String orderId;
    private Long amountInPaise;     // Razorpay works in smallest currency unit
    private String currency;
    private BigDecimal previewCredited;  // estimate shown to user before paying
}
