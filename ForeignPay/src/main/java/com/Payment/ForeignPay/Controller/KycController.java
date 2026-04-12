package com.Payment.ForeignPay.Controller;

import com.Payment.ForeignPay.DTO.KycStatusResponse;
import com.Payment.ForeignPay.Entity.KycApplication;
import com.Payment.ForeignPay.Service.KycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
public class KycController {

    private final KycService kycService;

    @PostMapping(value = "/apply", consumes = "multipart/form-data")
    public ResponseEntity<?> apply(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("passportNumber") String passportNumber,
            @RequestParam("passportFile") MultipartFile passportFile) {

        KycApplication app = kycService.submitKyc(
                userDetails.getUsername(), passportNumber, passportFile);

        return ResponseEntity.ok(Map.of(
                "message", "KYC application submitted",
                "applicationId", app.getId(),
                "status", app.getStatus().name()
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<KycStatusResponse> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(kycService.getKycStatus(userDetails.getUsername()));
    }
}
