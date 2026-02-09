package com.pz.backend.service;

import com.pz.backend.exceptions.NotFoundException;
import jakarta.mail.MessagingException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

public interface ReportService {

    ByteArrayOutputStream get(Long userId,int month, int year)throws NotFoundException, IOException;

    void email(Long userId,String email,int month, int year) throws NotFoundException, IOException, MessagingException;
}
