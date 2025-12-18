package main

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

func sendEmail(order Order) error {
	log.Println("=== EMAIL DEBUG START ===")
	log.Printf("📧 Order ID: %d", order.ID)
	log.Printf("📧 EMAIL_FROM: '%s'", os.Getenv("EMAIL_FROM"))
	log.Printf("📧 EMAIL_TO: '%s'", os.Getenv("EMAIL_TO"))

	pass := os.Getenv("EMAIL_APP_PASSWORD")
	log.Printf("📧 EMAIL_APP_PASSWORD length: %d", len(pass))
	log.Printf("📧 EMAIL_APP_PASSWORD (first 4): '%s'",
		strings.Replace(pass, " ", "_", -1))

	from := os.Getenv("EMAIL_FROM")
	password := os.Getenv("EMAIL_APP_PASSWORD")
	to := os.Getenv("EMAIL_TO")

	log.Printf("Debug email config - FROM: %s, TO: %s, PASS set: %v", from, to, password != "")

	if from == "" {
		return fmt.Errorf("EMAIL_FROM not set")
	}
	if to == "" {
		return fmt.Errorf("EMAIL_TO not set")
	}
	if password == "" {
		return fmt.Errorf("EMAIL_APP_PASSWORD not set")
	}

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	subject := "Comandă nouă de mobilă"

	var productsList string
	for _, item := range order.Items {
		productsList += fmt.Sprintf("- %s (x%d) - %.2f MDL\n",
			item.Product.Name,
			item.Quantity,
			item.Price*float64(item.Quantity))
	}

	log.Printf("📧 Email data - Name: %s, Phone: %s, Address: '%s', City: '%s'",
		order.Name, order.Phone, order.Address, order.City)

	body := fmt.Sprintf(
		"Nume: %s\nTelefon: %s\nEmail: %s\nAdresă: %s\nOraș: %s\nNote: %s\n\nProduse:\n%s\nTotal: %.2f MDL",
		order.Name, order.Phone, order.Email, order.Address, order.City, order.Notes,
		productsList, order.Total,
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
		log.Println("Eroare la trimiterea email:", err)
	} else {
		log.Println("Email trimis cu succes!")
	}
	return err
}
