const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Firebase Admin SDK setup
// npm install firebase-admin
// Затем запустите: node upload-tokens.js

const FIREBASE_SERVICE_ACCOUNT = require('./service-account.json');

async function main() {
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');

  initializeApp({
    credential: cert(FIREBASE_SERVICE_ACCOUNT)
  });

  const db = getFirestore();
  const tokensPath = path.join(__dirname, 'tokens.json');
  const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

  console.log(`Загружаем ${tokens.length} токенов в Firebase...`);

  const batch = db.batch();
  tokens.forEach(t => {
    const ref = db.collection('tokens').doc(t.token);
    batch.set(ref, {
      token: t.token,
      used: t.used || false,
      usedBy: t.usedBy || null,
      createdAt: t.createdAt || new Date().toISOString()
    });
  });

  await batch.commit();
  console.log(`✓ Загружено ${tokens.length} токенов`);
}

main().catch(console.error);
