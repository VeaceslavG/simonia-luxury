package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable client_encoding=utf8",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Nu mă pot conecta la DB:", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal(err)
	}

	queries := []string{
		"SET client_encoding TO 'UTF8'",
		"SET CLIENT_ENCODING TO 'UTF8'",
		"SET client_encoding = 'UTF8'",
	}

	for _, query := range queries {
		_, err = sqlDB.Exec(query)
		if err != nil {
			log.Printf("⚠️ Eroare la %s: %v", query, err)
		}
	}

	var encoding string
	err = DB.Raw("SHOW client_encoding").Scan(&encoding).Error
	if err != nil {
		log.Fatal("❌ Nu pot verifica encoding:", err)
	}

	log.Printf("🔍 Client encoding: %s", encoding)

	var test string
	err = DB.Raw("SELECT 'TEST: Scândură Școală ĂÎÂȘȚ'").Scan(&test).Error
	if err != nil {
		log.Fatal("❌ Eroare test diacritice:", err)
	}

	log.Printf("🧪 Test diacritice: %s", test)

	if strings.Contains(test, "?") {
		log.Fatal("❌ ENCODING INCORECT! Diacriticele sunt corupte!")
	}

	log.Println("✅ Conexiune reușită cu encoding UTF-8 verificat")
}
