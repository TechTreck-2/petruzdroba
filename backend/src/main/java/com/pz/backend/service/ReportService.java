package com.pz.backend.service;

import com.pz.backend.exceptions.NotFoundException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

public interface ReportService {

    ByteArrayOutputStream get(Long userId,int month, int year)throws NotFoundException, IOException;
}
