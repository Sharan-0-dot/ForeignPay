package com.Payment.ForeignPay.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiCompanionRequest {
    @NotBlank
    private String message;
}
