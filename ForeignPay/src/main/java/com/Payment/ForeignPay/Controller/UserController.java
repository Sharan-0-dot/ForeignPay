package com.Payment.ForeignPay.Controller;

import com.Payment.ForeignPay.DTO.UserProfileResponse;
import com.Payment.ForeignPay.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(
            // Spring injects the UserDetails object that JwtFilter put in
            // the security context. Its username field is the email.
            @AuthenticationPrincipal UserDetails userDetails) {

        UserProfileResponse profile = userService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }
}
