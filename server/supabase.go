package main

import (
	"log"
	"os"
	"strings"

	storage_go "github.com/supabase-community/storage-go"
	supabase "github.com/supabase-community/supabase-go"
)

var Supabase *supabase.Client

func InitSupabase() {
	url := os.Getenv("SUPABASE_URL")
	key := os.Getenv("SUPABASE_SERVICE_KEY")

	client, err := supabase.NewClient(url, key, nil)
	if err != nil {
		log.Fatal("Supabase init error:", err)
	}

	Supabase = client
}

func migrateLocalImagesToSupabase() error {
	dir := "./uploads/products"
	files, err := os.ReadDir(dir)
	if err != nil {
		return err // Dacă folderul nu există local, nu avem ce migra
	}

	for _, f := range files {
		if f.IsDir() {
			continue
		}

		localPath := dir + "/" + f.Name()
		file, err := os.Open(localPath)
		if err != nil {
			continue
		}

		path := "products/" + f.Name()
		contentType := "image/jpeg"
		upsert := true

		_, err = Supabase.Storage.UploadFile(
			"products",
			path,
			file,
			storage_go.FileOptions{
				ContentType: &contentType,
				Upsert:      &upsert,
			},
		)
		file.Close()

		if err != nil {
			log.Println("Eroare upload la migrare:", f.Name(), err)
			continue
		}

		// Luăm URL-ul public nou
		newPublicURL := Supabase.Storage.GetPublicUrl("products", path).SignedURL

		// Căutăm în baza de date produsele care au acest nume de fișier în array-ul de imagini
		var products []Product
		// Căutăm produsele unde image_urls conține numele fișierului vechi
		DB.Where("image_urls::text LIKE ?", "%"+f.Name()+"%").Find(&products)

		for _, p := range products {
			changed := false
			for i, oldUrl := range p.ImageURLs {
				// Dacă URL-ul vechi conține numele fișierului și NU este deja un URL de Supabase
				if strings.Contains(oldUrl, f.Name()) && !strings.HasPrefix(oldUrl, "http") {
					p.ImageURLs[i] = newPublicURL
					changed = true
				}
			}
			if changed {
				DB.Model(&p).Update("image_urls", p.ImageURLs)
				log.Printf("Migrat cu succes imaginea pentru produsul: %s\n", p.Name)
			}
		}
	}
	return nil
}
