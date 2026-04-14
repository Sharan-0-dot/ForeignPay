package com.Payment.ForeignPay.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataResponse {
    private List<PieDataPoint> pieData;
    private List<DailySpendPoint> dailySpend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PieDataPoint {
        private String name;
        private BigDecimal value;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySpendPoint {
        private String date;
        private BigDecimal amount;
    }
}
