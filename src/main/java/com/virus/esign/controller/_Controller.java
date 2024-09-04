package com.virus.esign.controller;

import org.json.JSONObject;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;

@Controller
//@RequestMapping("/")
public class _Controller {

    @GetMapping("/")
    @CrossOrigin("*")
    public String index(Model model, @RequestBody(required = false) String body) throws IOException {
//        JSONObject bodyObject = new JSONObject(body);

        byte[] bytes = Base64.getEncoder().encode(Files.readAllBytes(Paths.get("C:\\Users\\Pericent\\Downloads\\USB Based E-Sign.pdf")));

        model.addAttribute("file", new String(bytes));
//        model.addAttribute("pass", pass);

        return "index";
    }

}
