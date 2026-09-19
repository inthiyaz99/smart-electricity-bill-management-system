package com.smartbill.smartbill.controller;

import com.smartbill.smartbill.model.Meter;
import com.smartbill.smartbill.model.User;
import com.smartbill.smartbill.repository.MeterRepository;
import com.smartbill.smartbill.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/meters")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class MeterController {

    private final MeterRepository meterRepository;
    private final UserRepository userRepository;

    public MeterController(MeterRepository meterRepository, UserRepository userRepository) {
        this.meterRepository = meterRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/test")
    public String test() {
        return "SmartBill Backend is Working!";
    }

    @GetMapping
    public List<Meter> getAllMeters() {
        return meterRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Meter> getMetersByUser(@PathVariable Long userId) {
        return meterRepository.findByUserId(userId);
    }

    @PostMapping
    public Meter addMeter(@RequestBody Meter meter) {
        return meterRepository.save(meter);
    }

    @PostMapping("/{userId}")
    public ResponseEntity<?> addMeterForUser(@PathVariable Long userId, @RequestBody Meter meter) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found with id: " + userId);
        }
        meter.setUser(userOpt.get());
        Meter saved = meterRepository.save(meter);
        return ResponseEntity.ok(saved);
    }
}