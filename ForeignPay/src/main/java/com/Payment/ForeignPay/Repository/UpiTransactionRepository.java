package com.Payment.ForeignPay.Repository;

import com.Payment.ForeignPay.Entity.UpiTransaction;
import com.Payment.ForeignPay.Enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UpiTransactionRepository extends JpaRepository<UpiTransaction, Long> {

    List<UpiTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<UpiTransaction> findByUserIdAndStatus(Long userId, TransactionStatus status);

    List<UpiTransaction> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}
