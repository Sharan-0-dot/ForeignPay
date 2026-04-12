package com.Payment.ForeignPay.Repository;

import com.Payment.ForeignPay.Entity.TopupTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopupTransactionRepository extends JpaRepository<TopupTransaction, Long> {

    Optional<TopupTransaction> findByRazorpayOrderId(String orderId);
    List<TopupTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

}