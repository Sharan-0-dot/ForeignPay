package com.Payment.ForeignPay.Controller;

import com.Payment.ForeignPay.DTO.PaymentInitiateRequest;
import com.Payment.ForeignPay.DTO.PaymentResponse;
import com.Payment.ForeignPay.DTO.TransactionHistoryResponse;
import com.Payment.ForeignPay.Service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<PaymentResponse> initiate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PaymentInitiateRequest request) {

        PaymentResponse response = paymentService.initiatePayment(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<TransactionHistoryResponse>> history(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                paymentService.getHistory(userDetails.getUsername()));
    }
}
