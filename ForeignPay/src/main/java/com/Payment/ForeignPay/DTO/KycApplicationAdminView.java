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
public class KycApplicationAdminView {
    private Long applicationId;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String passportNumber;
    private String passportImageUrl;
    private LocalDateTime submittedAt;
}
