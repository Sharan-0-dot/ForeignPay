package com.Payment.ForeignPay.Service;

import com.Payment.ForeignPay.DTO.PaymentInitiateRequest;
import com.Payment.ForeignPay.DTO.PaymentResponse;
import com.Payment.ForeignPay.DTO.TransactionHistoryResponse;
import com.Payment.ForeignPay.Entity.UpiTransaction;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Enums.KycStatus;
import com.Payment.ForeignPay.Enums.TransactionStatus;
import com.Payment.ForeignPay.Repository.UpiTransactionRepository;
import com.Payment.ForeignPay.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final UserRepository userRepository;
    private final UpiTransactionRepository upiTransactionRepository;

    @Transactional
    public PaymentResponse initiatePayment(String email, PaymentInitiateRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Guard 1: KYC must be approved before any payment
        if (user.getKycStatus() != KycStatus.APPROVED) {
            throw new RuntimeException(
                    "KYC not approved. Complete KYC verification before making payments.");
        }

        // Guard 2: wallet must have enough balance
        if (user.getWalletBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException(
                    "Insufficient wallet balance. Current balance: ₹" + user.getWalletBalance());
        }

        // Validate category — default to Other if unrecognized
        String category = resolveCategory(request.getCategory());

        // Create PENDING record first — if anything fails after this,
        // the @Transactional rolls back this save too
        UpiTransaction tx = UpiTransaction.builder()
                .user(user)
                .merchantUpiId(request.getMerchantUpiId())
                .merchantName(request.getMerchantName())
                .amount(request.getAmount())
                .category(category)
                .status(TransactionStatus.PENDING)
                .build();
        upiTransactionRepository.save(tx);

        // Simulate UPI payout
        // In production this would be a Razorpay Payout API call
        // For now: generate a mock UTR (Unique Transaction Reference)
        String mockUtr = generateMockUtr();

        // Update transaction to SUCCESS and deduct wallet
        // Both happen in the same @Transactional — atomic
        tx.setStatus(TransactionStatus.SUCCESS);
        tx.setMockUtr(mockUtr);
        upiTransactionRepository.save(tx);

        user.setWalletBalance(user.getWalletBalance().subtract(request.getAmount()));
        userRepository.save(user);

        return PaymentResponse.builder()
                .success(true)
                .transactionId(tx.getId())
                .utr(mockUtr)
                .merchantName(request.getMerchantName())
                .amount(request.getAmount())
                .remainingBalance(user.getWalletBalance())
                .message("Payment successful")
                .build();
    }

    public List<TransactionHistoryResponse> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return upiTransactionRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(tx -> TransactionHistoryResponse.builder()
                        .id(tx.getId())
                        .merchantName(tx.getMerchantName())
                        .merchantUpiId(tx.getMerchantUpiId())
                        .amount(tx.getAmount())
                        .category(tx.getCategory())
                        .utr(tx.getMockUtr())
                        .status(tx.getStatus().name())
                        .createdAt(tx.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String generateMockUtr() {
        // UTR format: MOCK + 9 digits
        long number = (long) (Math.random() * 900_000_000L) + 100_000_000L;
        return "MOCK" + number;
    }

    private String resolveCategory(String input) {
        if (input == null) return "Other";
        return switch (input.trim()) {
            case "Food"          -> "Food";
            case "Transport"     -> "Transport";
            case "Shopping"      -> "Shopping";
            case "Entertainment" -> "Entertainment";
            default              -> "Other";
        };
    }
}