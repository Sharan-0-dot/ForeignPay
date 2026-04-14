package com.Payment.ForeignPay.Service;

import com.Payment.ForeignPay.DTO.AiCompanionResponse;
import com.Payment.ForeignPay.DTO.AiInsightsResponse;
import com.Payment.ForeignPay.Entity.UpiTransaction;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Enums.TransactionStatus;
import com.Payment.ForeignPay.Repository.UpiTransactionRepository;
import com.Payment.ForeignPay.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiService {

    private final ChatClient.Builder chatClientBuilder;
    private final UserRepository userRepository;
    private final UpiTransactionRepository upiTransactionRepository;

    // ─── Chat companion ───────────────────────────────────────────────────────

    public AiCompanionResponse getCompanionReply(String email, String userMessage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String context = buildSpendContext(user);

        String prompt = """
                You are a friendly AI travel finance companion for an international tourist in India using the ForeignPay app.
                
                %s
                
                User says: %s
                
                Reply in 3-4 sentences. Be friendly and specific — mention actual amounts and categories from their spend data.
                Suggest what they can still comfortably afford based on their remaining balance.
                Do not use markdown formatting in your reply.
                """.formatted(context, userMessage);

        String reply = chatClientBuilder.build()
                .prompt(prompt)
                .call()
                .content();

        return AiCompanionResponse.builder().reply(reply).build();
    }

    // ─── Proactive insights ───────────────────────────────────────────────────

    public AiInsightsResponse getInsights(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String context = buildSpendContext(user);

        String prompt = """
                You are a travel finance analyst. Based on the following spend data, generate exactly 3 concise insights.
                
                %s
                
                Rules:
                - Return exactly 3 insights, one per line
                - Each insight must be a single sentence
                - Include specific numbers and percentages
                - Do not use bullet points, numbers, or any prefix characters
                - Do not use markdown formatting
                """.formatted(context);

        String rawReply = chatClientBuilder.build()
                .prompt(prompt)
                .call()
                .content();

        // Split on newlines, clean up blank lines
        List<String> insights = Arrays.stream(rawReply.split("\n"))
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .limit(3)
                .collect(Collectors.toList());

        return AiInsightsResponse.builder().insights(insights).build();
    }

    // ─── Helper: build spend context string for prompts ───────────────────────

    private String buildSpendContext(User user) {
        List<UpiTransaction> recentTxns =
                upiTransactionRepository.findTop10ByUserIdOrderByCreatedAtDesc(user.getId());

        String txSummary = recentTxns.isEmpty()
                ? "No transactions yet."
                : recentTxns.stream()
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                .map(t -> "- %s: ₹%.2f (%s) on %s".formatted(
                        t.getMerchantName() != null ? t.getMerchantName() : "Unknown",
                        t.getAmount(),
                        t.getCategory(),
                        t.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd"))))
                .collect(Collectors.joining("\n"));

        return """
                Current wallet balance: ₹%.2f
                Recent transactions:
                %s
                """.formatted(user.getWalletBalance(), txSummary);
    }
}