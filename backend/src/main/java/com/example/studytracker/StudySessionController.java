package com.example.studytracker;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "http://localhost:3000")
public class StudySessionController {

    private final StudySessionRepository repository;

    public StudySessionController(StudySessionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<StudySession> getSessions(@RequestParam(required = false) String semesterId) {
        if (semesterId != null) {
            return repository.findBySemesterId(semesterId);
        }
        return repository.findAll();
    }

    @PostMapping
    public StudySession createSession(@RequestBody StudySession session) {
        return repository.save(session);
    }
}