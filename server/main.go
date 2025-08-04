package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"

	"github.com/joho/godotenv"
)

type Order struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
	Email string `json:"email"`
	Notes string `json:"notes"`
}

func sendEmail(order Order) error {
	from := os.Getenv("EMAIL_FROM")
	password := os.Getenv("EMAIL_APP_PASSWORD")
	if password == "" {
		log.Fatal("Parola nu este setată!")
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
			"Subject: " + subject + "\r\n" +
			"\r\n" +
			body,
	)

	auth := smtp.PlainAuth("", from, password, smtpHost)
	return smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
}

func handleOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var order Order
	err := json.NewDecoder(r.Body).Decode(&order)
	if err != nil {
		log.Println("Eroare trimitere email:", err)
		http.Error(w, "Eroare la trimiterea comenzii", http.StatusInternalServerError)
		return
	}

	// Afisam comanda in consola
	log.Printf("Comandă primită: %+v\n", order)

	// Send email
	err = sendEmail(order)
	if err != nil {
		log.Println("Eroare trimitere email:", err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Comandă salvată cu succes"))
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Eroare la încărcarea fișierului .env")
	}

	http.HandleFunc("/api/order", handleOrder)

	// Accepta cereri CORS de la fontend (localhost: 3000 de obicei)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			return
		}
	})

	log.Println("Serverul pornește pe :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
