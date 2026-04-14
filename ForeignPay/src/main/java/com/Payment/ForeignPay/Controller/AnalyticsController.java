package com.Payment.ForeignPay.Controller;

import com.Payment.ForeignPay.DTO.AnalyticsSummaryResponse;
import com.Payment.ForeignPay.DTO.ChartDataResponse;
import com.Payment.ForeignPay.Service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryResponse> getSummary(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                analyticsService.getSummary(userDetails.getUsername()));
    }

    @GetMapping("/charts")
    public ResponseEntity<ChartDataResponse> getChartData(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                analyticsService.getChartData(userDetails.getUsername()));
    }
}
