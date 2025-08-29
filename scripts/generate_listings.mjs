import { writeFile, mkdir } from 'fs/promises';

const OUT = 'src/content/listings';
await mkdir(OUT, { recursive: true });

const items = [
  { slug: 'kilimani-3br-apartment', title: 'Modern 3BR Apartment in Kilimani', price: 85000, location: 'Kilimani, Nairobi', beds: 3, baths: 2, type: 'Apartment', availability: 'For Rent' },
  { slug: 'westlands-2br-house', title: 'Cozy 2BR House in Westlands', price: 65000, location: 'Westlands, Nairobi', beds: 2, baths: 1, type: 'House', availability: 'For Rent' },
  { slug: 'riverside-4br-townhouse', title: 'Elegant 4BR Townhouse in Riverside', price: 185000, location: 'Riverside, Nairobi', beds: 4, baths: 3, type: 'Townhouse', availability: 'For Sale' },
  { slug: 'karen-cottage-stay', title: 'Karen Garden Cottage (Short Stay)', price: 12000, location: 'Karen, Nairobi', beds: 2, baths: 1, type: 'Cottage', availability: 'Short Stays' },
];

for (const x of items) {
  const md = `---
title: "${x.title}"
price: ${x.price}
location: "${x.location}"
bedrooms: ${x.beds}
bathrooms: ${x.baths}
type: "${x.type}"
availability: "${x.availability}"
imagesFolder: /images/properties/luxury-4br-villa-in-karen
amenities:
  - Secure Parking
  - Modern Kitchen
  - High-speed Internet
---

Well-presented ${x.beds}-bedroom ${x.type.toLowerCase()} located in ${x.location.split(',')[0]}. Walking distance to key amenities.
`;
  await writeFile(`${OUT}/${x.slug}.md`, md, 'utf8');
  console.log(`Created: ${x.slug}.md`);
}
