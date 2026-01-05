package com.example.studytracker;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GradeEntryRepository extends MongoRepository<GradeEntry, String> {
    List<GradeEntry> findBySubjectId(String subjectId);
}