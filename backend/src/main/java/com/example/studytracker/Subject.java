package com.example.studytracker;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "subjects")
public class Subject {
    @Id
    private String id;
    private String name;
    private String semesterId; // <--- Linked to Semester
}