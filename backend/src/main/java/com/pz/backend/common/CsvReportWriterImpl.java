package com.pz.backend.common;

import com.pz.backend.entity.WorkLog;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class CsvReportWriterImpl implements CsvReportWriter{

    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Override
    public void write(List<WorkLog> workLogs, OutputStream out, ZoneId zoneId) throws IOException {
        for (WorkLog log : workLogs) {
            Instant logIn = log.getDate();
            Instant logOut = logIn.plusMillis(log.getTimeWorked());
            double hours = log.getTimeWorked() / 1000.0 / 60 / 60;

            String line = String.format("%s,%s,%.2f\n",
                    logIn.atZone(zoneId).format(TIME_FMT),
                    logOut.atZone(zoneId).format(TIME_FMT),
                    hours);

            out.write(line.getBytes(StandardCharsets.UTF_8));
        }

    }
}
