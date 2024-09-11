package com.virus.esign.controller;

import com.virus.esign.service.SignService;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin("*")
public class _RestController {

    @Autowired
    private SignService signService;

    private static final Logger log = LoggerFactory.getLogger(_RestController.class);

    @GetMapping("/")
    public String hello() {
        return "Service is running";
    }

    @PostMapping("/sign")
    public ResponseEntity getSigned(@RequestBody String body) throws IOException {

//        log.info("Body: {}", body);
        JSONObject bodyObject = new JSONObject(body);

        String fileBytes = bodyObject.getString("file");

        String pass = bodyObject.getString("pass");
        String reason = bodyObject.getString("reason");
        String location = bodyObject.getString("location");
        float x = bodyObject.getFloat("x");
        float y = bodyObject.getFloat("y");
        int pageNumber = bodyObject.getInt("page");


        File file = null;
        File signedFile = null;
        try {

            file = File.createTempFile("original", ".pdf");
            try (FileOutputStream fos = new FileOutputStream(file)) {
                // To be short I use a corrupted PDF string, so make sure to use a valid one if you want to preview the PDF file

                byte[] decoder = Base64.getDecoder().decode(fileBytes);

                fos.write(decoder);
                System.out.println("PDF File Saved");
            }

            signedFile = File.createTempFile("signed", ".pdf");
            signService.getSigned(file, signedFile, pass, reason, location, x, y, pageNumber);

            if (signedFile.length() == 0) {
                return new ResponseEntity<>("500 Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return ResponseEntity.ok()
                    .body(Base64.getEncoder().encode(Files.readAllBytes(Paths.get(signedFile.getAbsolutePath()))));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            if (file != null)
                FileUtils.forceDelete(file);
            if (signedFile != null && signedFile.length() != 0)
                FileUtils.forceDelete(signedFile);
        }
    }
}
