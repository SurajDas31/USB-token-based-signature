package com.virus.esign;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;

public class App {
    public static void main(String[] args) {
        String pdfFilePath = "";

        try {
            PdfReader pdfReader = new PdfReader(pdfFilePath);
            PdfDocument pdfDocument = new PdfDocument(pdfReader);

            int pageNumber = 1;
            com.itextpdf.kernel.geom.Rectangle pageSize = pdfDocument.getPage(pageNumber).getPageSize();

            float width = pageSize.getWidth();
            float height = pageSize.getHeight();

            System.out.println("Width: " + width + " points");
            System.out.println("Height: " + height + " points");

            pdfDocument.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}