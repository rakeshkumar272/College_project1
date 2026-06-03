const bcrypt = require('bcryptjs');

async function main() {
  const hash = '$2b$10$3nA/tgTWHUbssLuDyHbDZuAIY7RHezHu2yxAThbU36k4h8OzRrQjC';
  const password = 't13592$M';
  const isMatch = await bcrypt.compare(password, hash);
  console.log(`Password matches hash: ${isMatch}`);
}

main();
