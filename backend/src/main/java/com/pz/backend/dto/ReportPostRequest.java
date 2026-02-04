package com.pz.backend.dto;

public record ReportPostRequest(
        Long userId,
        String email,
        Integer month,
        Integer year
) { }
