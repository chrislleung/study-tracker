package com.example.studytracker;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@CrossOrigin(origins = "http://localhost:3000")
public class AssessmentController {

    private final AssessmentRepository repository;

    public AssessmentController(AssessmentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Assessment> getAssessments(@RequestParam String subjectId) {
        return repository.findBySubjectId(subjectId);
    }

    @PostMapping
    public Assessment createAssessment(@RequestBody Assessment assessment) {
        return repository.save(assessment);
    }

    // NEW: Update Assessment
    @PutMapping("/{id}")
    public Assessment updateAssessment(@PathVariable String id, @RequestBody Assessment updated) {
        return repository.findById(id)
            .map(assessment -> {
                assessment.setName(updated.getName());
                assessment.setType(updated.getType());
                assessment.setDate(updated.getDate());
                assessment.setGrade(updated.getGrade());
                return repository.save(assessment);
            })
            .orElseThrow(() -> new RuntimeException("Assessment not found"));
    }

    @DeleteMapping("/{id}")
    public void deleteAssessment(@PathVariable String id) {
        repository.deleteById(id);
    }
}