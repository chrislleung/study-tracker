package com.example.studytracker;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "sessions")
public class StudySession {
    @Id
    private String id;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long durationSeconds;
    private String subject;
    private String semesterId; // <--- Linked to Semester
}