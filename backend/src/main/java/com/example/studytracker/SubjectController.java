package com.example.studytracker;

import org.springframework.web.bind.annotation.*;
import java.util.List;

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
}