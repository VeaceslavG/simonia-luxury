package main

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

func sendEmail(order Order) error {
	from := os.Getenv("EMAIL_FROM")
	password := os.Getenv("EMAIL_APP_PASSWORD")
	if password == "" {
		log.Fatal("Parola nu este setată în .env!")
	}
	to := os.Getenv("EMAIL_TO")

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	subject := "Comandă nouă de mobilă"
	body := fmt.Sprintf(
		"Nume: %s\nTelefon: %s\nEmail: %s\nNote: %s",
		order.Name, order.Phone, order.Email, order.Notes,
	)

	message := []byte(
		"From: " + from + "\r\n" +
			"To: " + to + "\r\n" +
			"Reply-To: " + order.Email + "\r\n" +
			"Subject: " + subject + "\r\n\r\n" +
			body,
	)

	auth := smtp.PlainAuth("", from, password, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
	if err != nil {
		log.Println("⚠️ Eroare la trimiterea email:", err)
	}
	return err
}
