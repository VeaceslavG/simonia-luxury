import defaultImage from "../../assets/default_image.png";
import { API_URL } from "../../config/api";

export function getImageUrl(image_urls) {
  if (!image_urls) return defaultImage;

  const images = Array.isArray(image_urls) ? image_urls : String(image_urls).split(",");

  const first = images[0]?.trim();
  if (!first) return defaultImage;

  if (first.startsWith("http")) return first;

  const cleanPath = first.startsWith("/") ? first : `\${first}`;
  return `${API_URL}${cleanPath}`;
}