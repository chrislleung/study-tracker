package com.example.studytracker;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssessmentRepository extends MongoRepository<Assessment, String> {
    List<Assessment> findBySubjectId(String subjectId);
}