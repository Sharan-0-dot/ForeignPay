package com.Payment.ForeignPay.DTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentInitiateRequest {

    @NotBlank(message = "Merchant UPI ID is required")
    private String merchantUpiId;

    private String merchantName;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Minimum payment is ₹1")
    private BigDecimal amount;

    private String category = "Other";
}