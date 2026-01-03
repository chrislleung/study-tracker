package com.example.studytracker;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "semesters")
public class Semester {
    @Id
    private String id;
    private String name;
    private boolean archived = false; // Default to false
}