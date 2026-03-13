package com.resumechecker.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class ResumeParser {

    public String parse(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();

        boolean isPdf = contentType.contains("pdf") || fileName.endsWith(".pdf");
        boolean isDocx = contentType.contains("wordprocessingml") || fileName.endsWith(".docx");
        boolean isTxt = contentType.contains("text/plain") || fileName.endsWith(".txt");

        if (isPdf) {
            return parsePdf(file.getBytes());
        }
        if (isDocx) {
            return parseDocx(file.getBytes());
        }
        if (isTxt) {
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }

        throw new IllegalArgumentException("Only PDF, DOCX, and TXT files are supported.");
    }

    private String parsePdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String parseDocx(byte[] bytes) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new java.io.ByteArrayInputStream(bytes))) {
            List<XWPFParagraph> paragraphs = document.getParagraphs();
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph paragraph : paragraphs) {
                sb.append(paragraph.getText()).append('\n');
            }
            return sb.toString();
        }
    }
}
