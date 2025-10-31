const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function refreshGoogleToken() {
  try {
    console.log('Starting Google Calendar token refresh...');
    
    // Read credentials
    const credentialsPath = path.join(__dirname, '..', 'database', 'credentials.json');
    const tokenPath = path.join(__dirname, '..', 'database', 'token.json');
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error('Credentials file not found');
    }
    
    if (!fs.existsSync(tokenPath)) {
      throw new Error('Token file not found');
    }
    
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    
    console.log('Credentials loaded:', credentials.web.client_id);
    console.log('Current token expiry:', token.expiry);
    
    // Set up OAuth2 client
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    // Set the existing token
    oAuth2Client.setCredentials({
      refresh_token: token.refresh_token,
      access_token: token.access_token || null
    });
    
    console.log('Refreshing access token...');
    
    // Refresh the token
    const { credentials: newCredentials } = await oAuth2Client.refreshAccessToken();
    
    console.log('New token received, expires at:', newCredentials.expiry_date);
    
    // Update token object
    const updatedToken = {
      client_id: token.client_id,
      client_secret: token.client_secret,
      refresh_token: token.refresh_token,
      access_token: newCredentials.access_token,
      expiry: new Date(newCredentials.expiry_date).toISOString()
    };
    
    // Save updated token
    fs.writeFileSync(tokenPath, JSON.stringify(updatedToken, null, 2));
    
    console.log('✅ Token refreshed successfully!');
    console.log('New expiry date:', updatedToken.expiry);
    
    // Test the token by making a simple API call
    console.log('Testing token with Calendar API...');
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const calendarList = await calendar.calendarList.list();
    
    console.log('✅ Token test successful! Found', calendarList.data.items?.length || 0, 'calendars');
    
    return updatedToken;
    
  } catch (error) {
    console.error('❌ Error refreshing token:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n🔧 The refresh token has expired or been revoked.');
      console.error('You need to re-authorize the application:');
      console.error('1. Go to Google Cloud Console');
      console.error('2. Enable Google Calendar API');
      console.error('3. Create new OAuth 2.0 credentials');
      console.error('4. Run a new authorization flow');
    }
    
    throw error;
  }
}

// Run the refresh
if (require.main === module) {
  refreshGoogleToken()
    .then(() => {
      console.log('\n🎉 Google Calendar token refresh completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to refresh Google Calendar token:', error.message);
      process.exit(1);
    });
}

module.exports = { refreshGoogleToken };