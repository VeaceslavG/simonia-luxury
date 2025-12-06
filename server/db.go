package main

import (
	"log"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")

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
