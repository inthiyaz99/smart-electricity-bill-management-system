package com.smartbill.smartbill.controller;

import com.smartbill.smartbill.model.Bill;
import com.smartbill.smartbill.model.Meter;
import com.smartbill.smartbill.model.Reading;
import com.smartbill.smartbill.repository.BillRepository;
import com.smartbill.smartbill.repository.MeterRepository;
import com.smartbill.smartbill.repository.ReadingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/readings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class ReadingController {

    private final ReadingRepository readingRepository;
    private final MeterRepository meterRepository;
    private final BillRepository billRepository;

    public ReadingController(ReadingRepository readingRepository,
                             MeterRepository meterRepository,
                             BillRepository billRepository) {
        this.readingRepository = readingRepository;
        this.meterRepository = meterRepository;
        this.billRepository = billRepository;
    }

    @GetMapping
    public List<Reading> getAllReadings() {
        return readingRepository.findAll();
    }

    @GetMapping("/meter/{meterId}")
    public List<Reading> getReadingsByMeter(@PathVariable Long meterId) {
        return readingRepository.findByMeterIdOrderByReadingDateDesc(meterId);
    }

    @PostMapping
    public Reading addReading(@RequestBody Reading reading) {
        return readingRepository.save(reading);
    }

    @PostMapping("/meter/{meterId}")
    public ResponseEntity<?> addReadingForMeter(@PathVariable Long meterId, @RequestBody Reading reading) {
        Optional<Meter> meterOpt = meterRepository.findById(meterId);
        if (meterOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Meter not found with id: " + meterId);
        }

        Meter meter = meterOpt.get();
        reading.setMeter(meter);

        double units = reading.getCurrentReading() - reading.getPreviousReading();
        if (units < 0) {
            return ResponseEntity.badRequest().body("Current reading must be greater than or equal to previous reading");
        }
        reading.setUnitsUsed(units);
        Reading savedReading = readingRepository.save(reading);

        // Progressive slab bill calculation
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
        energyCharge = Math.round(energyCharge * 100.0) / 100.0;
        double fixedCharge = 50.0;
        double totalAmount = Math.round((energyCharge + fixedCharge) * 100.0) / 100.0;

        // Parse reading date or use current time
        LocalDateTime billDateTime = LocalDateTime.now();
        if (reading.getReadingDate() != null && !reading.getReadingDate().isBlank()) {
            try {
                LocalDate parsedDate = LocalDate.parse(reading.getReadingDate(), DateTimeFormatter.ISO_LOCAL_DATE);
                billDateTime = parsedDate.atTime(12, 0);
            } catch (Exception ignored) {
            }
        }

        // Check if a bill already exists for this meter on the same date to avoid duplication
        final LocalDateTime targetBillDate = billDateTime;
        List<Bill> existingBills = billRepository.findByMeterIdOrderByBillDateDesc(meterId);
        Optional<Bill> matchingBill = existingBills.stream()
                .filter(b -> b.getBillDate() != null &&
                        b.getBillDate().toLocalDate().equals(targetBillDate.toLocalDate()))
                .findFirst();

        Bill billToSave;
        if (matchingBill.isPresent()) {
            billToSave = matchingBill.get();
            billToSave.setUnitsConsumed(units);
            billToSave.setEnergyCharge(energyCharge);
            billToSave.setFixedCharge(fixedCharge);
            billToSave.setTotalAmount(totalAmount);
        } else {
            billToSave = new Bill();
            billToSave.setMeter(meter);
            billToSave.setUnitsConsumed(units);
            billToSave.setEnergyCharge(energyCharge);
            billToSave.setFixedCharge(fixedCharge);
            billToSave.setTotalAmount(totalAmount);
            billToSave.setBillDate(billDateTime);
        }

        billRepository.save(billToSave);

        return ResponseEntity.ok(savedReading);
    }
}
