// Purpose: Provide MongoDB access for resume analysis history.
package com.resumechecker.repository;

import com.resumechecker.model.ResumeHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HistoryRepository extends MongoRepository<ResumeHistory, String> {
    List<ResumeHistory> findTop10ByUserIdOrderByCreatedAtDesc(String userId);
}
