package com.smartbill.smartbill.repository;
import java.util.Optional;
import com.smartbill.smartbill.model.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    List<LoginHistory> findByUserIdOrderByLoginTimeDesc(Long userId);

    Optional<LoginHistory> findFirstByUserIdAndLogoutTimeIsNullOrderByLoginTimeDesc(Long userId);
}