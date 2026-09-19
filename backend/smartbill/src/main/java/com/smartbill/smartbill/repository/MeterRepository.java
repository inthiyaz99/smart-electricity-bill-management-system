package com.smartbill.smartbill.repository;

import com.smartbill.smartbill.model.Meter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeterRepository extends JpaRepository<Meter, Long> {

    List<Meter> findByUserId(Long userId);

}