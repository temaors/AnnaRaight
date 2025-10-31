const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function officialWay() {
  try {
    console.log('🔧 Используем официальный способ Google...');
    
    // Load desktop credentials
    const credentialsPath = path.join(__dirname, '..', 'database', 'credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ Файл credentials.json не найден!');
      return;
    }
    
    // Use Google's official auth flow
    const { GoogleAuth } = require('google-auth-library');
    
    const auth = new GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    
    console.log('✅ Auth object created');
    
    // This should work for service accounts, but let's try manual approach
    console.log('');
    console.log('🔗 Попробуйте этот URL (создан через официальный способ):');
    
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const clientInfo = credentials.installed || credentials.web;
    
    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${encodeURIComponent(clientInfo.client_id)}&` +
      `redirect_uri=${encodeURIComponent('urn:ietf:wg:oauth:2.0:oob')}&` +  
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    console.log(authUrl);
    console.log('');
    console.log('📋 После авторизации запустите:');
    console.log('node scripts/save-final-token.js ВАШ_КОД_ЗДЕСЬ');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

officialWay();