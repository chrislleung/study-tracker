package com.example.studytracker;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Data
@Document(collection = "assessments")
public class Assessment {
    @Id
    private String id;
    private String name;        // e.g. "Midterm 1"
    private String type;        // "Exam" or "Quiz"
    private LocalDate date;     // When it happened
    private String grade;       // e.g. "95" or "A"
    private String subjectId;   // Links to the specific class
}