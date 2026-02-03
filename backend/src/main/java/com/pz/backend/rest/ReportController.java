package com.pz.backend.rest;

import com.pz.backend.dto.ReportGetRequest;
import com.pz.backend.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequestMapping("/api")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/reports/monthly")
    public void downloadMonthlyReport(HttpServletResponse response,
                                      @RequestParam Long userId,
                                      @RequestParam Integer month,
                                      @RequestParam Integer year) throws IOException {

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=worklog.csv");

        ByteArrayOutputStream csvData = reportService.get(userId, month, year);
        csvData.writeTo(response.getOutputStream());
    }

}
