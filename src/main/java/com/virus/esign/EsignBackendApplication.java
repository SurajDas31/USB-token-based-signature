package com.virus.esign;


import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import javax.swing.*;


@SpringBootApplication
public class EsignBackendApplication {

    public static void main(String[] args) {
//        SpringApplication.run(DocedgeEsignBackendApplication.class, args);

        ConfigurableApplicationContext context = createApplicationContext(args);

        runMainGUI(context);

    }

    private static ConfigurableApplicationContext createApplicationContext(String[] args) {
        return new SpringApplicationBuilder(EsignBackendApplication.class)
                .headless(false)
                .run(args);
    }

    private static void runMainGUI(ConfigurableApplicationContext context) {
        SwingUtilities.invokeLater(() -> {
            JOptionPane.showMessageDialog(null, "Port is running on 9099");
        });
    }

}
