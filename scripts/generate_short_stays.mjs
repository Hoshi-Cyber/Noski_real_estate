// scripts/generate_short_stays.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = "src/content/listings";
const IMG_ROOT = "public/images/properties";
const placeholder = "public/images/placeholder.webp";

const stays = [
  { slug: "karen-garden-cottage-stay",              title: "Karen Garden Cottage (Short Stay)",         location: "Karen, Nairobi",        type: "Cottage",    beds: 2, baths: 1, price: 9500 },
  { slug: "westlands-city-view-studio-stay",        title: "Westlands City-View Studio",                 location: "Westlands, Nairobi",    type: "Studio",     beds: 1, baths: 1, price: 6500 },
  { slug: "kilimani-1br-serviced-apartment-stay",   title: "Kilimani 1BR Serviced Apartment",            location: "Kilimani, Nairobi",     type: "Apartment",  beds: 1, baths: 1, price: 8000 },
  { slug: "lavington-2br-furnished-stay",           title: "Lavington 2BR Furnished",                    location: "Lavington, Nairobi",    type: "Apartment",  beds: 2, baths: 2, price: 12000 },
  { slug: "nyari-guest-wing-stay",                  title: "Nyari Guest Wing (Private Entry)",           location: "Nyari, Nairobi",        type: "House",      beds: 1, baths: 1, price: 9000 },
  { slug: "runda-courtyard-suite-stay",             title: "Runda Courtyard Suite",                      location: "Runda, Nairobi",        type: "Suite",      beds: 1, baths: 1, price: 10000 },
  { slug: "parklands-2br-ensuite-stay",             title: "Parklands 2BR En-suite",                     location: "Parklands, Nairobi",    type: "Apartment",  beds: 2, baths: 2, price: 11000 },
  { slug: "kajiado-ngong-ridge-cabin-stay",         title: "Ngong Ridge Cabin",                          location: "Ngong, Kajiado",        type: "Cabin",      beds: 2, baths: 1, price: 7000 },
  { slug: "kitengela-family-apartment-stay",        title: "Kitengela Family Apartment",                 location: "Kitengela, Kajiado",    type: "Apartment",  beds: 3, baths: 2, price: 9000 },
  { slug: "kisii-hilltop-retreat-stay",             title: "Kisii Hilltop Retreat",                      location: "Kisii, Kisii",          type: "Cottage",    beds: 2, baths: 1, price: 6000 },
  { slug: "naivasha-lakeside-cottage-stay",         title: "Naivasha Lakeside Cottage",                  location: "Naivasha, Nakuru",      type: "Cottage",    beds: 2, baths: 1, price: 11000 },
  { slug: "malindi-beach-bungalow-stay",            title: "Malindi Beach Bungalow",                     location: "Malindi, Kilifi",       type: "Bungalow",   beds: 2, baths: 2, price: 13000 },
];

function md(l) {
  const imagesFolder = `/images/properties/${l.slug}`;
  return `---
title: "${l.title}"
price: ${l.price}
location: "${l.location}"
bedrooms: ${l.beds}
bathrooms: ${l.baths}
type: "${l.type}"
availability: "Short Stays"
imagesFolder: ${imagesFolder}
amenities:
  - Fast Wi-Fi
  - Hot Shower
  - Secure Parking
  - Backup Power
description: |
  Comfortable ${l.beds}-bed ${l.type.toLowerCase()} in ${l.location}. Ideal for business or leisure. Flexible check-in and friendly support.
---

Well-appointed interiors, clean linens and easy access to shops and transport. Book your stay today.`;
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(IMG_ROOT, { recursive: true });

for (const l of stays) {
  const file = path.join(OUT, `${l.slug}.md`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, md(l), "utf8");
    console.log("Created", file);
  } else {
    console.log("Exists", file);
  }

  const dir = path.join(IMG_ROOT, l.slug);
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= 6; i++) {
    const target = path.join(dir, `${i}.webp`);
    if (!fs.existsSync(target)) {
      fs.copyFileSync(placeholder, target);
    }
  }
}
console.log("Done: 12 Short Stays + image folders.");
