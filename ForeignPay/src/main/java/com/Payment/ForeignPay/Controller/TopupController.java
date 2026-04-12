package com.Payment.ForeignPay.Controller;

import com.Payment.ForeignPay.DTO.TopupCreateRequest;
import com.Payment.ForeignPay.DTO.TopupOrderResponse;
import com.Payment.ForeignPay.DTO.TopupVerifyRequest;
import com.Payment.ForeignPay.DTO.TopupVerifyResponse;
import com.Payment.ForeignPay.Service.TopupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/topup")
@RequiredArgsConstructor
public class TopupController {

    private final TopupService topupService;

    @PostMapping("/create-order")
    public ResponseEntity<TopupOrderResponse> createOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TopupCreateRequest request) throws Exception {

        TopupOrderResponse response = topupService.createOrder(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<TopupVerifyResponse> verify(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TopupVerifyRequest request) throws Exception {

        TopupVerifyResponse response = topupService.verifyAndCredit(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }
}
