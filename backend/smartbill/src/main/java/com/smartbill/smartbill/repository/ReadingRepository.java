package com.smartbill.smartbill.repository;

import com.smartbill.smartbill.model.Reading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReadingRepository extends JpaRepository<Reading, Long> {
    List<Reading> findByMeterIdOrderByIdDesc(Long meterId);
    List<Reading> findByMeterIdOrderByReadingDateDesc(Long meterId);
}