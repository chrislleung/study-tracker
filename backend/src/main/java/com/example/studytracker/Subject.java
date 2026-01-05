package com.example.studytracker;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Data
@Document(collection = "subjects")
public class Subject {
    @Id
    private String id;
    private String name;
    private String semesterId;
    
    private Map<String, Double> gradeWeights = new HashMap<>();
    private List<String> assignmentTypes = new ArrayList<>();
    
    // NEW FIELD
    private int totalExams = 2; // Default to 2

    public Subject() {
        this.assignmentTypes.add("Exam");
    }
}