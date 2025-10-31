const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '..', 'database', 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const { client_id } = credentials.web;

// Create manual URL with different parameter order
const params = [
  'response_type=code',
  'client_id=' + encodeURIComponent(client_id),
  'redirect_uri=' + encodeURIComponent('http://localhost:3002'),
  'scope=' + encodeURIComponent('https://www.googleapis.com/auth/calendar'),
  'access_type=offline',
  'prompt=consent',
  'include_granted_scopes=true'
].join('&');

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + params;

console.log('🔗 Попробуйте эту ссылку (параметры в другом порядке):');
console.log('');
console.log(authUrl);
console.log('');
console.log('📋 После авторизации скопируйте код из URL и запустите:');
console.log('node scripts/save-manual-token.js ВАШ_КОД_ЗДЕСЬ');