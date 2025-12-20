package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

func sendEmail(order Order) error {
	log.Printf("Order ID %d:", order.ID)

	apiKey := os.Getenv("BREVO_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("BREVO_API_KEY not set")
	}

	emailRequest := map[string]interface{}{
		"sender": map[string]string{
			"name":  "Simonia Luxury",
			"email": os.Getenv("EMAIL_FROM"),
		},
		"to": []map[string]string{
			{
				"email": os.Getenv("EMAIL_TO"),
				"name":  "Administrator",
			},
		},
		"subject":     fmt.Sprintf("Comandă Nouă #%d de la %s", order.ID, order.Name),
		"htmlContent": buildOrderHTML(order),
	}

	requestBody, err := json.Marshal(emailRequest)
	if err != nil {
		return fmt.Errorf("Error on marshal json: %v", err)
	}

	req, err := http.NewRequest(
		"POST",
		"https://api.brevo.com/v3/smtp/email",
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("api-key", apiKey)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Error Brevo request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("Email trimis cu succes pentru order #%d", order.ID)
		return nil
	}

	var errorResponse map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&errorResponse)

	log.Printf("Brevo API error | Status: %d | Response: %+v",
		resp.StatusCode, errorResponse)

	return fmt.Errorf("Brevo API error (status %d)", resp.StatusCode)
}

func buildOrderHTML(order Order) string {
	return fmt.Sprintf(`
		<h2>Comandă nouă #%d</h2>
		<p><strong>Client:</strong> %s</p>
		<p><strong>Telefon:</strong> %s</p>
		<p><strong>Email client:</strong> <a href="mailto:%s">%s</a></p>
		<p><strong>Adresă:</strong> %s</p>
		<p><strong>Oraș:</strong> %s</p>
		<p><strong>Note:</strong> %s</p>

		<h3>Produse comandate:</h3>
		<ul>
			%s
		</ul>

		<h3>Total: %.2f MDL</h3>
	`,
		order.ID,
		order.Name,
		order.Phone,
		order.Email,
		order.Email,
		order.Address,
		order.City,
		order.Notes,
		generateProductsHTML(order.Items),
		order.Total,
	)
}

// generateProductsHTML construiește lista produselor
func generateProductsHTML(items []OrderItem) string {
	html := ""
	for _, item := range items {
		html += fmt.Sprintf(
			"<li>%s × %d — %.2f MDL</li>",
			item.Product.Name,
			item.Quantity,
			item.Price*float64(item.Quantity),
		)
	}
	return html
}
