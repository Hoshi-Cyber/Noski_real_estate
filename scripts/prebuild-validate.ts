import { validateListings } from "../src/lib/build-utils";

validateListings()
  .then(() => {
    console.log("Listings validation passed.");
  })
  .catch((err) => {
    console.error(String(err?.message ?? err));
    process.exit(1);
  });
