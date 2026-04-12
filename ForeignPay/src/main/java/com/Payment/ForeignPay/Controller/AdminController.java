package com.Payment.ForeignPay.Controller;

import com.Payment.ForeignPay.DTO.KycApplicationAdminView;
import com.Payment.ForeignPay.DTO.ReviewRequest;
import com.Payment.ForeignPay.Service.KycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final KycService kycService;

    @GetMapping("/kyc/pending")
    public ResponseEntity<List<KycApplicationAdminView>> getPending() {
        return ResponseEntity.ok(kycService.getPendingApplications());
    }

    @PostMapping("/kyc/{applicationId}/approve")
    public ResponseEntity<?> approve(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) ReviewRequest request) {

        String remarks = (request != null) ? request.getRemarks() : "Approved";
        kycService.approveKyc(applicationId, userDetails.getUsername(), remarks);

        return ResponseEntity.ok(Map.of(
                "message", "KYC approved",
                "applicationId", applicationId
        ));
    }

    @PostMapping("/kyc/{applicationId}/reject")
    public ResponseEntity<?> reject(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ReviewRequest request) {

        kycService.rejectKyc(applicationId, userDetails.getUsername(), request.getRemarks());

        return ResponseEntity.ok(Map.of(
                "message", "KYC rejected",
                "applicationId", applicationId
        ));
    }
}
