package com.example.studytracker;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "http://localhost:3000")
public class SubjectController {

    private final SubjectRepository repository;

    public SubjectController(SubjectRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Subject> getSubjects(@RequestParam(required = false) String semesterId) {
        if (semesterId != null) {
            return repository.findBySemesterId(semesterId);
        }
        return repository.findAll();
    }

    @PostMapping
    public Subject createSubject(@RequestBody Subject subject) {
        return repository.save(subject);
    }

    @DeleteMapping("/{id}")
    public void deleteSubject(@PathVariable String id) {
        repository.deleteById(id);
    }

    // UPDATE Types List
    @PutMapping("/{id}/types")
    public Subject updateTypes(@PathVariable String id, @RequestBody List<String> types) {
        return repository.findById(id)
            .map(subject -> {
                // Backend validation: Ensure "Exam" is always present
                if (!types.contains("Exam")) {
                    types.add(0, "Exam"); 
                }
                subject.setAssignmentTypes(types);
                return repository.save(subject);
            })
            .orElseThrow(() -> new RuntimeException("Subject not found"));
    }

    @PutMapping("/{id}/config")
    public Subject updateConfig(@PathVariable String id, @RequestBody SubjectConfigDTO config) {
        return repository.findById(id)
            .map(subject -> {
                subject.setGradeWeights(config.weights);
                subject.setTotalExams(config.totalExams); // Save the count
                return repository.save(subject);
            })
            .orElseThrow(() -> new RuntimeException("Subject not found"));
    }
}

class SubjectConfigDTO {
    public Map<String, Double> weights;
    public int totalExams;
}