package com.example.studytracker;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "grade_entries")
public class GradeEntry {
    @Id
    private String id;
    private String name;        // e.g., "Homework 1"
    private double score;       // e.g., 90.0
    private double totalPoints; // e.g., 100.0
    private String category;    // e.g., "Homework"
    private String subjectId;
}