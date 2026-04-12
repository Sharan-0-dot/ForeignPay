package com.Payment.ForeignPay.Repository;

import com.Payment.ForeignPay.Entity.KycApplication;
import com.Payment.ForeignPay.Enums.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycApplicationRepository extends JpaRepository<KycApplication, Long> {

    List<KycApplication> findByStatus(KycStatus status);
    Optional<KycApplication> findTopByUserIdOrderBySubmittedAtDesc(Long userId);
}
