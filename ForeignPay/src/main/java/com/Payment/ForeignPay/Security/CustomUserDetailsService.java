package com.Payment.ForeignPay.Security;

import com.Payment.ForeignPay.Entity.Admin;
import com.Payment.ForeignPay.Entity.User;
import com.Payment.ForeignPay.Repository.AdminRepository;
import com.Payment.ForeignPay.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            return org.springframework.security.core.userdetails.User.builder()
                    .username(user.get().getEmail())
                    .password(user.get().getPasswordHash())
                    .roles("USER")
                    .build();
        }

        Optional<Admin> admin = adminRepository.findByEmail(email);
        if (admin.isPresent()) {
            return org.springframework.security.core.userdetails.User.builder()
                    .username(admin.get().getEmail())
                    .password(admin.get().getPasswordHash())
                    .roles("ADMIN")
                    .build();
        }

        throw new UsernameNotFoundException("No account found: " + email);
    }
}