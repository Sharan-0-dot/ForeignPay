package com.Payment.ForeignPay.Entity;

import com.Payment.ForeignPay.Enums.KycStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many applications → one user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Many applications → one admin (nullable — starts with no reviewer)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_admin_id")
    private Admin reviewedByAdmin;

    @Column(nullable = false)
    private String passportNumber;

    @Column(nullable = false, length = 500)
    private String passportImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus status = KycStatus.PENDING;

    @Column(length = 500)
    private String adminRemarks;

    private LocalDateTime submittedAt = LocalDateTime.now();

    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }
}
