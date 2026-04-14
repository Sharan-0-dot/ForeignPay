package com.Payment.ForeignPay.Controller;

import com.Payment.ForeignPay.DTO.AiCompanionRequest;
import com.Payment.ForeignPay.DTO.AiCompanionResponse;
import com.Payment.ForeignPay.DTO.AiInsightsResponse;
import com.Payment.ForeignPay.Service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/companion")
    public ResponseEntity<AiCompanionResponse> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AiCompanionRequest request) {

        return ResponseEntity.ok(
                aiService.getCompanionReply(
                        userDetails.getUsername(), request.getMessage()));
    }

    @GetMapping("/insights")
    public ResponseEntity<AiInsightsResponse> insights(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                aiService.getInsights(userDetails.getUsername()));
    }
}
