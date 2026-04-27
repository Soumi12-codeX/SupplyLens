package com.web.backend_SupplyLens;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class BackendSupplyLensApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendSupplyLensApplication.class, args);
	}
}
