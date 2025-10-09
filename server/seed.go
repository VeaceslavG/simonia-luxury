package main

import (
	"strconv"

	"gorm.io/gorm"
)

// SeedProducts populates test products
func SeedProducts() {
	categories := map[string]Product{
		"Canapele": {
			Name:        "Canapea Confort",
			Description: "O canapea foarte confortabilă – dimensiuni: 200x90x85 cm",
			Price:       350,
			ImageURL:    "http://localhost:8080/images/canapea.jpg",
			Category:    "Canapele",
		},
		"Coltare": {
			Name:        "Colțar Modern",
			Description: "Colțar extensibil – dimensiuni: 250x150x90 cm",
			Price:       1600,
			ImageURL:    "http://localhost:8080/images/coltar.jpg",
			Category:    "Coltare",
		},
		"Fotolii": {
			Name:        "Fotoliu Relaxare",
			Description: "Fotoliu confortabil – dimensiuni: 90x90x100 cm",
			Price:       500,
			ImageURL:    "http://localhost:8080/images/fotoliu.jpg",
			Category:    "Fotolii",
		},
		"Paturi": {
			Name:        "Pat Matrimonial",
			Description: "Pat confortabil – dimensiuni: 200x180x50 cm",
			Price:       1400,
			ImageURL:    "http://localhost:8080/images/pat.jpg",
			Category:    "Paturi",
		},
	}

	for _, template := range categories {
		for i := 1; i <= 8; i++ {
			p := template
			p.Name = template.Name + " " + strconv.Itoa(i)

			var existing Product
			if err := DB.Where("name = ? AND category = ?", p.Name, p.Category).First(&existing).Error; err == gorm.ErrRecordNotFound {
				DB.Create(&p)
			}
		}
	}

}
