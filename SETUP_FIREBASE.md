# Firebase Setup for Square of Mysteries

## Prerequisites
- Node.js installed
- Firebase CLI: `npm install -g firebase-tools`
- Your Firebase project is already created at [console.firebase.google.com](https://console.firebase.google.com)

## Step 1: Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **squares-of-mystery**
3. Go to **Realtime Database** → **Create Database**
4. Choose **Start in test mode** (for development)
5. Select **us-central1** as your region

## Step 2: Set Security Rules

1. In Firebase Console, go to **Realtime Database** → **Rules** tab
2. Replace the default rules with:
```json
{
  "rules": {
    "gameState": {
      ".read": true,
      ".write": true
    },
    "latestEvent": {
      ".read": true,
      ".write": true
    }
  }
}
```
3. Click **Publish**

⚠️ **Warning:** These rules allow anyone with your database URL to read/write. For production, implement proper authentication.

## Step 3: Deploy to Firebase Hosting

```bash
# Install Firebase CLI if not already done
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project directory
firebase init hosting

# When prompted:
# - Select your project: squares-of-mystery
# - Public directory: . (current directory)
# - Configure as single-page app: No
# - Overwrite existing files: No

# Deploy
firebase deploy
```

## Step 4: Access Your Game

After deployment, Firebase will provide a hosting URL:
```
https://squares-of-mystery.web.app
```

Share this URL with your team to access the game from any device.

## Testing Locally

If you prefer to test locally first:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# In the project directory, start the emulator
firebase emulators:start --only database

# Access locally at http://localhost:4000
```

## Switching Between Firebase and Local Server

- **Firebase**: Uses real-time sync across all devices automatically
- **Local Server**: Run `node server.js` on one machine; others connect via its IP

To use the local server instead, the game will fall back automatically if Firebase is unavailable.

## Troubleshooting

### Game data not syncing
- Check that Firebase Realtime Database is created and active
- Verify security rules are published
- Check browser console for Firebase errors

### Can't see updates from other devices
- Ensure all devices are using the same Firebase project
- Check that internet connectivity is stable
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Firebase auth errors
- Verify your Firebase config in `firebase-config.js` matches your project
- Check that the project ID and API keys are correct
