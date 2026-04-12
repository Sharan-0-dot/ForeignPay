package com.Payment.ForeignPay.Service;

import com.Payment.ForeignPay.DTO.TopupCreateRequest;
import com.Payment.ForeignPay.DTO.TopupOrderResponse;
import com.Payment.ForeignPay.DTO.TopupVerifyRequest;
import com.Payment.ForeignPay.DTO.TopupVerifyResponse;
import com.Payment.ForeignPay.Entity.TopupTransaction;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Enums.TransactionStatus;
import com.Payment.ForeignPay.Repository.TopupTransactionRepository;
import com.Payment.ForeignPay.Repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TopupService {

    private final UserRepository userRepository;
    private final TopupTransactionRepository topupTransactionRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private static final BigDecimal COMMISSION_PERCENT = new BigDecimal("2.00");

    // ─── STEP 1: Create Razorpay order ──────────────────────────────────────

    public TopupOrderResponse createOrder(String email, TopupCreateRequest request)
            throws RazorpayException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Fetch live FX rate to show a preview to the user
        BigDecimal fxRate = fetchUsdToInrRate();
        BigDecimal amountInr = request.getAmountUsd()
                .multiply(fxRate)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal commissionAmount = amountInr
                .multiply(COMMISSION_PERCENT)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal previewCredited = amountInr.subtract(commissionAmount);

        // Razorpay expects amount in paise (1 INR = 100 paise)
        long amountInPaise = amountInr
                .multiply(new BigDecimal("100"))
                .longValue();

        // Create order via Razorpay SDK
        RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_user_" + user.getId() + "_" + System.currentTimeMillis());

        Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        String razorpayOrderId = razorpayOrder.get("id");

        // Save PENDING record — this is your audit trail even if payment never completes
        TopupTransaction transaction = TopupTransaction.builder()
                .user(user)
                .razorpayOrderId(razorpayOrderId)
                .amountUsd(request.getAmountUsd())
                .commissionPercent(COMMISSION_PERCENT)
                .status(TransactionStatus.PENDING)
                .build();
        topupTransactionRepository.save(transaction);

        return TopupOrderResponse.builder()
                .orderId(razorpayOrderId)
                .amountInPaise(amountInPaise)
                .currency("INR")
                .previewCredited(previewCredited)
                .build();
    }

    // ─── STEP 2: Verify payment and credit wallet ────────────────────────────

    @Transactional
    public TopupVerifyResponse verifyAndCredit(String email, TopupVerifyRequest request)
            throws Exception {

        // Find the PENDING transaction we saved in step 1
        TopupTransaction transaction = topupTransactionRepository
                .findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // ── Signature verification ───────────────────────────────────────────
        // Razorpay signs: orderId + "|" + paymentId using your key secret
        // You recompute the same HMAC and compare — if they match, the payment
        // genuinely came from Razorpay and wasn't tampered with
        String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        String expectedSignature = hmacSha256(payload, razorpayKeySecret);

        if (!expectedSignature.equals(request.getRazorpaySignature())) {
            // Mark as failed so you have an audit record
            transaction.setStatus(TransactionStatus.FAILED);
            topupTransactionRepository.save(transaction);
            throw new RuntimeException("Payment signature verification failed");
        }

        // ── Calculate amounts ────────────────────────────────────────────────
        // Fetch live rate at verification time — this is the definitive rate
        // stored on the transaction record forever
        BigDecimal fxRate = fetchUsdToInrRate();
        BigDecimal amountInr = request.getAmountUsd()
                .multiply(fxRate)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal commissionAmount = amountInr
                .multiply(COMMISSION_PERCENT)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal finalCredited = amountInr.subtract(commissionAmount);

        // ── Update transaction record (all intermediate values stored) ───────
        transaction.setRazorpayPaymentId(request.getRazorpayPaymentId());
        transaction.setAmountInr(amountInr);
        transaction.setFxRate(fxRate);
        transaction.setCommissionAmount(commissionAmount);
        transaction.setFinalCredited(finalCredited);
        transaction.setStatus(TransactionStatus.SUCCESS);
        topupTransactionRepository.save(transaction);

        // ── Credit wallet — both saves in same @Transactional ────────────────
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setWalletBalance(user.getWalletBalance().add(finalCredited));
        userRepository.save(user);

        return TopupVerifyResponse.builder()
                .success(true)
                .creditedInr(finalCredited)
                .newBalance(user.getWalletBalance())
                .transactionId(transaction.getId())
                .build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private BigDecimal fetchUsdToInrRate() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<?, ?> response = restTemplate.getForObject(
                    "https://api.exchangerate-api.com/v4/latest/USD",
                    Map.class
            );
            Map<?, ?> rates = (Map<?, ?>) response.get("rates");
            Object inrRate = rates.get("INR");
            return new BigDecimal(inrRate.toString());
        } catch (Exception e) {
            // Fallback rate if API is unreachable during development
            // Remove this fallback before going to production
            System.err.println("FX rate fetch failed, using fallback: " + e.getMessage());
            return new BigDecimal("93.50");
        }
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(
                secret.getBytes("UTF-8"), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes("UTF-8"));

        // Convert bytes to hex string — must match Razorpay's format exactly
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
