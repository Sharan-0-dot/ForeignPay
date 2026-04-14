package com.Payment.ForeignPay.Service;

import com.Payment.ForeignPay.DTO.AnalyticsSummaryResponse;
import com.Payment.ForeignPay.DTO.ChartDataResponse;
import com.Payment.ForeignPay.Entity.UpiTransaction;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Enums.TransactionStatus;
import com.Payment.ForeignPay.Repository.UpiTransactionRepository;
import com.Payment.ForeignPay.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final UpiTransactionRepository upiTransactionRepository;

    public AnalyticsSummaryResponse getSummary(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UpiTransaction> txns = upiTransactionRepository
                .findByUserIdAndStatus(user.getId(), TransactionStatus.SUCCESS);

        // Total spend
        BigDecimal totalSpent = txns.stream()
                .map(UpiTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Group by category — sum and count per category
        Map<String, List<UpiTransaction>> byCategory = txns.stream()
                .collect(Collectors.groupingBy(UpiTransaction::getCategory));

        List<AnalyticsSummaryResponse.CategoryBreakdown> categories = byCategory.entrySet()
                .stream()
                .map(entry -> AnalyticsSummaryResponse.CategoryBreakdown.builder()
                        .category(entry.getKey())
                        .amount(entry.getValue().stream()
                                .map(UpiTransaction::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .count(entry.getValue().size())
                        .build())
                // Sort highest spend first
                .sorted(Comparator.comparing(
                        AnalyticsSummaryResponse.CategoryBreakdown::getAmount).reversed())
                .collect(Collectors.toList());

        return AnalyticsSummaryResponse.builder()
                .totalSpent(totalSpent)
                .transactionCount(txns.size())
                .categories(categories)
                .build();
    }

    public ChartDataResponse getChartData(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UpiTransaction> txns = upiTransactionRepository
                .findByUserIdAndStatus(user.getId(), TransactionStatus.SUCCESS);

        // Pie chart — category totals
        List<ChartDataResponse.PieDataPoint> pieData = txns.stream()
                .collect(Collectors.groupingBy(
                        UpiTransaction::getCategory,
                        Collectors.reducing(BigDecimal.ZERO,
                                UpiTransaction::getAmount, BigDecimal::add)))
                .entrySet().stream()
                .map(e -> ChartDataResponse.PieDataPoint.builder()
                        .name(e.getKey())
                        .value(e.getValue())
                        .build())
                .sorted(Comparator.comparing(ChartDataResponse.PieDataPoint::getValue).reversed())
                .collect(Collectors.toList());

        // Bar chart — daily spend totals sorted by date
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        List<ChartDataResponse.DailySpendPoint> dailySpend = txns.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO,
                                UpiTransaction::getAmount, BigDecimal::add)))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> ChartDataResponse.DailySpendPoint.builder()
                        .date(e.getKey().format(formatter))
                        .amount(e.getValue())
                        .build())
                .collect(Collectors.toList());

        return ChartDataResponse.builder()
                .pieData(pieData)
                .dailySpend(dailySpend)
                .build();
    }
}