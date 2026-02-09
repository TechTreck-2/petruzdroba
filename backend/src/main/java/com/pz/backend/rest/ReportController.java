package com.pz.backend.rest;

import com.pz.backend.dto.ReportGetRequest;
import com.pz.backend.dto.ReportPostRequest;
import com.pz.backend.exceptions.NotFoundException;
import com.pz.backend.service.ReportService;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PreAuthorize("hasRole('ADMIN') OR @reportSecurity.canAccessUser(#userId, authentication)")
    @GetMapping("/reports/monthly")
    public void downloadMonthlyReport(HttpServletResponse response,
                                      @RequestParam Long userId,
                                      @RequestParam Integer month,
                                      @RequestParam Integer year) throws NotFoundException,IOException {

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=worklog.csv");

        ByteArrayOutputStream csvData = reportService.get(userId, month, year);
        csvData.writeTo(response.getOutputStream());
    }

    @PreAuthorize("hasRole('ADMIN') OR @reportSecurity.canAccessUser(#request.userId, authentication)")
    @PostMapping("/reports/email")
    public void sendEmail(@RequestBody ReportPostRequest request) throws NotFoundException, IOException, MessagingException{
        reportService.email(request.userId(), request.email(), request.month(), request.year());
    }
}
