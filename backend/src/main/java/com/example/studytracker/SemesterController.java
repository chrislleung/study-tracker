package com.example.studytracker;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@CrossOrigin(origins = "http://localhost:3000")
public class SemesterController {

    private final SemesterRepository repository;

    public SemesterController(SemesterRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Semester> getAllSemesters() {
        return repository.findAll();
    }

    @PostMapping
    public Semester createSemester(@RequestBody Semester semester) {
        return repository.save(semester);
    }

    // New Endpoint to update (Archive/Unarchive)
    @PutMapping("/{id}")
    public Semester updateSemester(@PathVariable String id, @RequestBody Semester updatedSemester) {
        return repository.findById(id)
            .map(semester -> {
                semester.setArchived(updatedSemester.isArchived());
                // You could update name here too if desired
                return repository.save(semester);
            })
            .orElseThrow(() -> new RuntimeException("Semester not found"));
    }

    @DeleteMapping("/{id}")
    public void deleteSemester(@PathVariable String id) {
        repository.deleteById(id);
    }
}