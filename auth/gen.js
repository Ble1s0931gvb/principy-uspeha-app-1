const crypto = require('crypto');

function generateToken() {
  return 'NBK-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

const count = parseInt(process.argv[2]) || 1000;
const tokens = [];

for (let i = 0; i < count; i++) {
  tokens.push(generateToken());
}

console.log(`\n=== ${count} ТОКЕНОВ ===\n`);
tokens.forEach(t => console.log(t));
console.log(`\n=== КОПИРУЙ И ВСТАВЬ В auth.html VALID_TOKENS ===\n`);
