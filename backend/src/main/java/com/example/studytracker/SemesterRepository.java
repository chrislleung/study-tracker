package com.example.studytracker;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SemesterRepository extends MongoRepository<Semester, String> {
}