package com.pz.backend.common;

import com.pz.backend.entity.WorkLog;

import java.io.IOException;
import java.io.OutputStream;
import java.time.ZoneId;
import java.util.List;

public interface CsvReportWriter {
    void write(List<WorkLog> workLogs, OutputStream out, ZoneId zoneId) throws IOException;
}
