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

	var productsList string
	for _, item := range order.Items {
		productsList += fmt.Sprintf("- %s (x%d) - %.2f MDL\n",
			item.Product.Name,
			item.Quantity,
			item.Price*float64(item.Quantity))
	}

	// ✅ Adaugă logging pentru a verifica datele
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
		log.Println("⚠️ Eroare la trimiterea email:", err)
	} else {
		log.Println("✅ Email trimis cu succes!")
	}
	return err
}
