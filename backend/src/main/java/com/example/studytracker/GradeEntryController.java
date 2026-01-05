package com.example.studytracker;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin(origins = "http://localhost:3000")
public class GradeEntryController {

    private final GradeEntryRepository repository;

    public GradeEntryController(GradeEntryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<GradeEntry> getGrades(@RequestParam String subjectId) {
        return repository.findBySubjectId(subjectId);
    }

    @PostMapping
    public GradeEntry addGrade(@RequestBody GradeEntry grade) {
        return repository.save(grade);
    }

    // NEW: Update Endpoint
    @PutMapping("/{id}")
    public GradeEntry updateGrade(@PathVariable String id, @RequestBody GradeEntry updated) {
        return repository.findById(id)
            .map(grade -> {
                grade.setName(updated.getName());
                grade.setScore(updated.getScore());
                grade.setTotalPoints(updated.getTotalPoints());
                grade.setCategory(updated.getCategory());
                return repository.save(grade);
            })
            .orElseThrow(() -> new RuntimeException("Grade not found"));
    }

    @DeleteMapping("/{id}")
    public void deleteGrade(@PathVariable String id) {
        repository.deleteById(id);
    }
}