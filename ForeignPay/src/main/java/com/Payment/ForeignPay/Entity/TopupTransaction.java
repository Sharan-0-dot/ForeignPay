package com.Payment.ForeignPay.Entity;

import com.Payment.ForeignPay.Enums.TransactionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "topup_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopupTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String razorpayOrderId;

    private String razorpayPaymentId;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal amountUsd;

    @Column(precision = 12, scale = 2)
    private BigDecimal amountInr;

    @Column(precision = 10, scale = 4)
    private BigDecimal fxRate;

    @Column(precision = 5, scale = 2)
    private BigDecimal commissionPercent;

    @Column(precision = 10, scale = 2)
    private BigDecimal commissionAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal finalCredited;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
