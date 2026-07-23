const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateToken() {
  return 'NBK-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function generateTokens(count) {
  const tokens = [];
  for (let i = 0; i < count; i++) {
    tokens.push({
      token: generateToken(),
      used: false,
      usedBy: null,
      createdAt: new Date().toISOString()
    });
  }
  return tokens;
}

const count = parseInt(process.argv[2]) || 100;
const tokens = generateTokens(count);

const filePath = path.join(__dirname, 'tokens.json');
let existing = [];
if (fs.existsSync(filePath)) {
  existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const allTokens = [...existing, ...tokens];
fs.writeFileSync(filePath, JSON.stringify(allTokens, null, 2));

console.log(`\nСгенерировано токенов: ${count}`);
console.log(`Всего в базе: ${allTokens.length}`);
console.log(`Файл: ${filePath}`);
console.log(`\nПримеры токенов:`);
tokens.slice(0, 5).forEach(t => console.log(`  ${t.token}`));
