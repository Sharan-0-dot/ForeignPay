package com.Payment.ForeignPay.Service;


import com.Payment.ForeignPay.DTO.KycApplicationAdminView;
import com.Payment.ForeignPay.DTO.KycStatusResponse;
import com.Payment.ForeignPay.Entity.Admin;
import com.Payment.ForeignPay.Entity.KycApplication;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Enums.KycStatus;
import com.Payment.ForeignPay.Repository.AdminRepository;
import com.Payment.ForeignPay.Repository.KycApplicationRepository;
import com.Payment.ForeignPay.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KycService {

    private final KycApplicationRepository kycApplicationRepository;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final CloudinaryService cloudinaryService;

    // ─── USER: Submit KYC ───────────────────────────────────────────────────

    @Transactional
    public KycApplication submitKyc(String email, String passportNumber, MultipartFile passportFile) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Upload passport image to Cloudinary first — get the hosted URL
        String imageUrl = cloudinaryService.uploadPassport(passportFile, user.getId());

        // Save the URL on the User too (for quick access without joining kyc_applications)
        user.setPassportNumber(passportNumber);
        user.setPassportImageUrl(imageUrl);
        // Reset status to PENDING in case they're reapplying after a rejection
        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);

        // Create the KYC application record — this is the auditable event
        KycApplication application = KycApplication.builder()
                .user(user)
                .passportNumber(passportNumber)
                .passportImageUrl(imageUrl)
                .status(KycStatus.PENDING)
                .build();

        return kycApplicationRepository.save(application);
    }

    // ─── USER: Check KYC status ─────────────────────────────────────────────

    public KycStatusResponse getKycStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<KycApplication> latestApp =
                kycApplicationRepository.findTopByUserIdOrderBySubmittedAtDesc(user.getId());

        if (latestApp.isEmpty()) {
            // User hasn't submitted KYC yet
            return KycStatusResponse.builder()
                    .kycStatus(user.getKycStatus().name())
                    .applicationId(null)
                    .applicationStatus(null)
                    .submittedAt(null)
                    .adminRemarks(null)
                    .build();
        }

        KycApplication app = latestApp.get();
        return KycStatusResponse.builder()
                .kycStatus(user.getKycStatus().name())
                .applicationId(app.getId())
                .applicationStatus(app.getStatus().name())
                .submittedAt(app.getSubmittedAt())
                .adminRemarks(app.getAdminRemarks())
                .build();
    }

    // ─── ADMIN: Get all pending applications ────────────────────────────────

    public List<KycApplicationAdminView> getPendingApplications() {
        return kycApplicationRepository.findByStatus(KycStatus.PENDING)
                .stream()
                .map(app -> KycApplicationAdminView.builder()
                        .applicationId(app.getId())
                        .userId(app.getUser().getId())
                        .userFullName(app.getUser().getFullName())
                        .userEmail(app.getUser().getEmail())
                        .passportNumber(app.getPassportNumber())
                        .passportImageUrl(app.getPassportImageUrl())
                        .submittedAt(app.getSubmittedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ─── ADMIN: Approve ──────────────────────────────────────────────────────

    @Transactional
    public void approveKyc(Long applicationId, String adminEmail, String remarks) {

        KycApplication application = kycApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != KycStatus.PENDING) {
            throw new RuntimeException("Application is not in PENDING state");
        }

        Admin admin = adminRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Update the application record
        application.setStatus(KycStatus.APPROVED);
        application.setReviewedByAdmin(admin);
        application.setReviewedAt(LocalDateTime.now());
        application.setAdminRemarks(remarks);
        kycApplicationRepository.save(application);

        // Propagate to user — both writes happen in ONE @Transactional
        // If either fails, both roll back. No partial state.
        User user = application.getUser();
        user.setKycStatus(KycStatus.APPROVED);
        userRepository.save(user);
    }

    // ─── ADMIN: Reject ───────────────────────────────────────────────────────

    @Transactional
    public void rejectKyc(Long applicationId, String adminEmail, String remarks) {

        KycApplication application = kycApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != KycStatus.PENDING) {
            throw new RuntimeException("Application is not in PENDING state");
        }

        Admin admin = adminRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        application.setStatus(KycStatus.REJECTED);
        application.setReviewedByAdmin(admin);
        application.setReviewedAt(LocalDateTime.now());
        application.setAdminRemarks(remarks);
        kycApplicationRepository.save(application);

        // User's kycStatus goes back to PENDING so they can resubmit
        User user = application.getUser();
        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);
    }
}
