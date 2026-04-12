package com.Payment.ForeignPay.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycStatusResponse {
    private String kycStatus;
    private Long applicationId;
    private String applicationStatus;
    private LocalDateTime submittedAt;
    private String adminRemarks;
}
