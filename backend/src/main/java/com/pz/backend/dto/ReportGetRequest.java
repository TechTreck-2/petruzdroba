package com.pz.backend.dto;

public record ReportGetRequest(
        Long userId,
        Integer month,
        Integer year
) { }