// scripts/generate_for_rent.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = "src/content/listings";
const IMG_ROOT = "public/images/properties";
const placeholder = "public/images/placeholder.webp";

const listings = [
  // Nairobi core
  { slug: "karen-4br-garden-villa-for-rent",        title: "Karen 4BR Garden Villa",        location: "Karen, Nairobi",        type: "Villa",      beds: 4, baths: 3, price: 220000 },
  { slug: "kilimani-2br-modern-apartment-rent",     title: "Kilimani 2BR Modern Apartment", location: "Kilimani, Nairobi",     type: "Apartment",  beds: 2, baths: 2, price: 120000 },
  { slug: "kileleshwa-3br-with-gym-rent",           title: "Kileleshwa 3BR with Gym",       location: "Kileleshwa, Nairobi",    type: "Apartment",  beds: 3, baths: 2, price: 150000 },
  { slug: "lavington-3br-townhouse-dsq-rent",       title: "Lavington 3BR Townhouse + DSQ", location: "Lavington, Nairobi",     type: "Townhouse",  beds: 3, baths: 3, price: 180000 },
  { slug: "westlands-2br-skyline-apartment-rent",   title: "Westlands 2BR Skyline Apartment",location:"Westlands, Nairobi",     type: "Apartment",  beds: 2, baths: 2, price: 140000 },
  { slug: "parklands-3br-family-apartment-rent",    title: "Parklands 3BR Family Apartment", location:"Parklands, Nairobi",     type: "Apartment",  beds: 3, baths: 2, price: 135000 },
  { slug: "runda-5br-villa-rent",                   title: "Runda 5BR Villa (Corner Plot)", location: "Runda, Nairobi",        type: "Villa",      beds: 5, baths: 4, price: 350000 },
  { slug: "nyari-4br-contemporary-home-rent",       title: "Nyari 4BR Contemporary Home",   location: "Nyari, Nairobi",        type: "House",      beds: 4, baths: 4, price: 300000 },

  // Satellite towns
  { slug: "kitengela-4br-maisonette-garden-rent",   title: "Kitengela 4BR Maisonette + Garden", location: "Kitengela, Kajiado", type: "Maisonette", beds: 4, baths: 3, price: 85000 },
  { slug: "kiambu-4br-gated-community-rent",        title: "Kiambu 4BR Gated Community",    location: "Kiambu, Kiambu",        type: "House",      beds: 4, baths: 3, price: 110000 },
  { slug: "ngong-3br-bungalow-views-rent",          title: "Ngong 3BR Bungalow with Views", location: "Ngong, Kajiado",        type: "Bungalow",   beds: 3, baths: 2, price: 90000 },
  { slug: "ruaka-2br-new-build-rent",               title: "Ruaka 2BR New Build",           location: "Ruaka, Kiambu",         type: "Apartment",  beds: 2, baths: 2, price: 70000 },

  // Short commute zones
  { slug: "kasarani-2br-apartment-rent",            title: "Kasarani 2BR Apartment",        location: "Kasarani, Nairobi",     type: "Apartment",  beds: 2, baths: 1, price: 55000 },
  { slug: "embakasi-1br-apartment-rent",            title: "Embakasi 1BR Apartment",        location: "Embakasi, Nairobi",     type: "Apartment",  beds: 1, baths: 1, price: 40000 },
  { slug: "imara-daima-2br-master-en-suite-rent",   title: "Imara Daima 2BR (Master En-suite)", location:"Imara Daima, Nairobi",type:"Apartment",   beds: 2, baths: 2, price: 60000 },
  { slug: "south-b-3br-apartment-rent",             title: "South B 3BR Apartment",         location: "South B, Nairobi",      type: "Apartment",  beds: 3, baths: 2, price: 80000 },

  // Coast / upcountry examples
  { slug: "mombasa-2br-nyali-apartment-rent",       title: "Nyali 2BR Apartment (Pool Access)", location: "Nyali, Mombasa",    type: "Apartment",  beds: 2, baths: 2, price: 95000 },
  { slug: "malindi-3br-cottage-rent",               title: "Malindi 3BR Cottage",            location: "Malindi, Kilifi",      type: "Cottage",    beds: 3, baths: 2, price: 70000 },
  { slug: "nakuru-3br-townhouse-rent",              title: "Nakuru 3BR Townhouse",           location: "Nakuru, Nakuru",       type: "Townhouse",  beds: 3, baths: 3, price: 75000 },
  { slug: "eldoret-2br-apartment-rent",             title: "Eldoret 2BR Apartment",          location: "Eldoret, Uasin Gishu", type: "Apartment",  beds: 2, baths: 1, price: 50000 },
  { slug: "kisii-2br-apartment-rent",               title: "Kisii 2BR Apartment",            location: "Kisii, Kisii",         type: "Apartment",  beds: 2, baths: 1, price: 45000 },
  { slug: "thika-3br-maisonette-rent",              title: "Thika 3BR Maisonette",           location: "Thika, Kiambu",        type: "Maisonette", beds: 3, baths: 2, price: 65000 },
  { slug: "syokimau-3br-with-dsq-rent",             title: "Syokimau 3BR + DSQ",             location: "Syokimau, Machakos",   type: "Apartment",  beds: 3, baths: 3, price: 90000 },
  { slug: "ongata-rongai-2br-apartment-rent",       title: "Ongata Rongai 2BR Apartment",    location: "Ongata Rongai, Kajiado",type:"Apartment",  beds: 2, baths: 1, price: 50000 },
];

function mdFrontmatter(l) {
  const imagesFolder = `/images/properties/${l.slug}`;
  return `---
title: "${l.title}"
price: ${l.price}
location: "${l.location}"
bedrooms: ${l.beds}
bathrooms: ${l.baths}
type: "${l.type}"
availability: "For Rent"
imagesFolder: ${imagesFolder}
amenities:
  - Secure Parking
  - Reliable Water
  - Good Road Access
description: |
  Well-kept ${l.beds}-bedroom ${l.type.toLowerCase()} in ${l.location}. Convenient access to amenities and transport. Book a viewing.
---

Spacious living areas with natural light. Modern finishes and a practical layout for families or professionals.`;
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(IMG_ROOT, { recursive: true });

for (const l of listings) {
  // 1) Write listing file (skip if exists)
  const file = path.join(OUT, `${l.slug}.md`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, mdFrontmatter(l), "utf8");
    console.log("Created", file);
  } else {
    console.log("Exists", file);
  }

  // 2) Ensure images folder with 1–6.webp
  const dir = path.join(IMG_ROOT, l.slug);
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= 6; i++) {
    const target = path.join(dir, `${i}.webp`);
    if (!fs.existsSync(target)) {
      fs.copyFileSync(placeholder, target);
    }
  }
}
console.log("Done: 24 For Rent listings + image folders.");
