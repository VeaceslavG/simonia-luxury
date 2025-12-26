package main

import (
	"net/smtp"
	"os"
)

func SendEmail(to, subject, body string) error {
	from := os.Getenv("EMAIL_FROM")
	pass := os.Getenv("EMAIL_APP_PASSWORD")

	msg := "From: " + from + "\n" +
		"To: " + to + "\n" +
		"Subject: " + subject + "\n\n" +
		body

	return smtp.SendMail("smtp.gmail.com:587",
		smtp.PlainAuth("", from, pass, "smtp.gmail.com"),
		from, []string{to}, []byte(msg))
}

func productToResponse(p Product) ProductResponse {
	return ProductResponse{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Price:       float64(p.PriceCents) / 100,
		PriceCents:  p.PriceCents,
		CategoryID:  p.CategoryID,
		ImageURLs:   []string(p.ImageURLs),
		Dimensions:  p.Dimensions,
		IsActive:    p.IsActive,
		IsAvailable: p.IsAvailable,
	}
}
