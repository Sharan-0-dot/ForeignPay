package com.Payment.ForeignPay.Service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadPassport(MultipartFile file, Long userId) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "foreignpay/passports",
                            "public_id", "passport_user_" + userId + "_" + System.currentTimeMillis(),
                            "overwrite", true
                    )
            );

            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Passport upload failed", e);
        }
    }
}