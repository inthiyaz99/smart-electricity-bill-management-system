package com.smartbill.smartbill.controller;

import com.smartbill.smartbill.model.Bill;
import com.smartbill.smartbill.model.Meter;
import com.smartbill.smartbill.repository.BillRepository;
import com.smartbill.smartbill.repository.MeterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class BillController {

    private final BillRepository billRepository;
    private final MeterRepository meterRepository;

    public BillController(BillRepository billRepository, MeterRepository meterRepository) {
        this.billRepository = billRepository;
        this.meterRepository = meterRepository;
    }

    // ==========================================
    // PROGRESSIVE SLAB BILL CALCULATION
    // ==========================================
    @GetMapping("/calculate")
    public double calculateBill(@RequestParam double units) {
        if (units <= 0) {
            return 50.0; // Fixed charge only
        }

        double firstSlab = Math.min(units, 50);
        double secondSlab = Math.min(Math.max(units - 50, 0), 50);
        double thirdSlab = Math.min(Math.max(units - 100, 0), 100);
        double fourthSlab = Math.min(Math.max(units - 200, 0), 100);
        double fifthSlab = Math.max(units - 300, 0);

        double energyCharge = (firstSlab * 1.95) +
                              (secondSlab * 3.10) +
                              (thirdSlab * 4.80) +
                              (fourthSlab * 6.40) +
                              (fifthSlab * 7.50);

        double fixedCharge = 50.0;
        return Math.round((energyCharge + fixedCharge) * 100.0) / 100.0;
    }

    // ==========================================
    // DETAILED SLAB BREAKDOWN
    // ==========================================
    @GetMapping("/breakdown")
    public ResponseEntity<Map<String, Object>> getBillBreakdown(@RequestParam double units) {
        double u = Math.max(0, units);
        double firstSlab = Math.min(u, 50);
        double secondSlab = Math.min(Math.max(u - 50, 0), 50);
        double thirdSlab = Math.min(Math.max(u - 100, 0), 100);
        double fourthSlab = Math.min(Math.max(u - 200, 0), 100);
        double fifthSlab = Math.max(u - 300, 0);

        double firstAmount = Math.round(firstSlab * 1.95 * 100.0) / 100.0;
        double secondAmount = Math.round(secondSlab * 3.10 * 100.0) / 100.0;
        double thirdAmount = Math.round(thirdSlab * 4.80 * 100.0) / 100.0;
        double fourthAmount = Math.round(fourthSlab * 6.40 * 100.0) / 100.0;
        double fifthAmount = Math.round(fifthSlab * 7.50 * 100.0) / 100.0;

        double energyCharge = Math.round((firstAmount + secondAmount + thirdAmount + fourthAmount + fifthAmount) * 100.0) / 100.0;
        double fixedCharge = 50.0;
        double totalAmount = Math.round((energyCharge + fixedCharge) * 100.0) / 100.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("units", u);
        result.put("tier1Units", firstSlab);
        result.put("tier1Amount", firstAmount);
        result.put("tier2Units", secondSlab);
        result.put("tier2Amount", secondAmount);
        result.put("tier3Units", thirdSlab);
        result.put("tier3Amount", thirdAmount);
        result.put("tier4Units", fourthSlab);
        result.put("tier4Amount", fourthAmount);
        result.put("tier5Units", fifthSlab);
        result.put("tier5Amount", fifthAmount);
        result.put("energyCharge", energyCharge);
        result.put("fixedCharge", fixedCharge);
        result.put("totalAmount", totalAmount);

        return ResponseEntity.ok(result);
    }

    // ==========================================
    // GET BILLS BY METER ID
    // ==========================================
    @GetMapping("/meter/{meterId}")
    public List<Bill> getBillsByMeter(@PathVariable Long meterId) {
        return billRepository.findByMeterIdOrderByBillDateDesc(meterId);
    }

    // ==========================================
    // GET BILLS BY USER ID
    // ==========================================
    @GetMapping("/user/{userId}")
    public List<Bill> getBillsByUser(@PathVariable Long userId) {
        List<Meter> meters = meterRepository.findByUserId(userId);
        List<Bill> allBills = new ArrayList<>();
        for (Meter m : meters) {
            allBills.addAll(billRepository.findByMeterIdOrderByBillDateDesc(m.getId()));
        }
        allBills.sort((a, b) -> {
            if (a.getBillDate() == null || b.getBillDate() == null) return 0;
            return b.getBillDate().compareTo(a.getBillDate());
        });
        return allBills;
    }
}