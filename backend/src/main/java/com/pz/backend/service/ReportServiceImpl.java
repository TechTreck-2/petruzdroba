package com.pz.backend.service;

import com.pz.backend.common.CsvReportWriter;
import com.pz.backend.dao.WorkLogRepository;
import com.pz.backend.entity.WorkLog;
import com.pz.backend.exceptions.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

public class ReportServiceImpl implements ReportService {

    private final WorkLogRepository repository;
    @Autowired
    private final CsvReportWriter csvReportWriter;

    public ReportServiceImpl(WorkLogRepository repository, CsvReportWriter csvReportWriter) {
        this.repository = repository;
        this.csvReportWriter = csvReportWriter;
    }

    @Override
    public ByteArrayOutputStream get(Long userId, int month, int year) throws NotFoundException, IOException {
        ZoneId zoneId = ZoneId.of("Europe/Bucharest");

        Instant startDate = ZonedDateTime.of(year, month, 1, 0, 0, 0, 0, zoneId).toInstant();
        Instant endDate = startDate.atZone(zoneId).withDayOfMonth(startDate.atZone(zoneId).toLocalDate().lengthOfMonth())
                .withHour(23).withMinute(59).withSecond(59).withNano(999_999_999).toInstant();

        List<WorkLog> workLogs = repository.findByUserIdAndDateBetween(userId, startDate, endDate);

        if (workLogs.isEmpty()) {
            throw new NotFoundException(WorkLog.class.getName(), userId);
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        csvReportWriter.write(workLogs, outputStream, zoneId);

        return outputStream;
    }

}
