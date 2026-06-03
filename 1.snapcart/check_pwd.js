const bcrypt = require('bcryptjs');

async function main() {
  const hash = '$2b$10$wgY6uC7WPLqhbTBeBdUxrOdM5Zt2ayPq4ilfpq5t8PB7G1xCftOCe';
  const passwords = ['123456', '12345678', 'password', 'password123', 'admin', 'admin123', 't13592$M'];
  
  for (const p of passwords) {
    if (await bcrypt.compare(p, hash)) {
      console.log(`MATCH FOUND! The password is: ${p}`);
      return;
    }
  }
  console.log("No match found in common passwords.");
}
main();
