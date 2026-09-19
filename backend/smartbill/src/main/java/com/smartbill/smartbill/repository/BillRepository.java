package com.smartbill.smartbill.repository;

import com.smartbill.smartbill.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByMeterIdOrderByBillDateDesc(Long meterId);

}