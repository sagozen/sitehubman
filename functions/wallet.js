const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

// Ensure firebase-admin is initialized in index.js before this module runs
// We define secrets that must be set securely via Firebase Secret Manager.
// NEVER hardcode private keys or certificates in the repository.

const appleWWDRCert = defineSecret('APPLE_WALLET_WWDR_CERT'); // Base64 encoded WWDR certificate
const appleSignerCert = defineSecret('APPLE_WALLET_SIGNER_CERT'); // Base64 encoded Pass Type ID certificate
const appleSignerKey = defineSecret('APPLE_WALLET_SIGNER_KEY'); // Base64 encoded Pass Type ID private key
const appleSignerKeyPassphrase = defineSecret('APPLE_WALLET_SIGNER_KEY_PASSPHRASE'); 
const googleWalletCredentials = defineSecret('GOOGLE_WALLET_CREDENTIALS'); // JSON string of Google Service Account credentials

// Initialize Passkit generator dynamically to avoid slow cold starts if unused
let PKPass = null;

async function generateAppleWalletPassLogic(data, secrets) {
  if (!PKPass) {
    const passkit = await import('passkit-generator');
    PKPass = passkit.PKPass;
  }

  // Note: These need to be parsed from the base64 secrets in production
  // This is a foundational stub showing the secure pipeline.
  const { wwdr, signerCert, signerKey, signerKeyPassphrase } = secrets;

  if (!wwdr || !signerCert || !signerKey) {
    throw new Error('Apple Wallet credentials are not properly configured.');
  }

  // Stub configuration for the pass
  const pass = new PKPass({
    "passTypeIdentifier": "pass.com.sagozen.oneapp.businesscard",
    "teamIdentifier": "RYGM3T4HUL", // Match from eas.json
    "organizationName": "SiteHub",
    "description": "SiteHub Digital Business Card",
    "logoText": "SiteHub",
    "foregroundColor": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(13, 13, 14)", // canvas #0D0D0E
    "labelColor": "rgb(161, 161, 170)", // secondary #A1A1AA
    "barcode": {
      "message": data.profileUrl || "https://sitehub.app",
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1"
    }
  }, {
    wwdr: Buffer.from(wwdr, 'base64'),
    signerCert: Buffer.from(signerCert, 'base64'),
    signerKey: Buffer.from(signerKey, 'base64'),
    signerKeyPassphrase: signerKeyPassphrase
  });

  // Example: Add fields to the pass
  pass.primaryFields.push({
    key: "name",
    label: "NAME",
    value: data.name || "SiteHub User"
  });

  pass.secondaryFields.push({
    key: "title",
    label: "TITLE",
    value: data.title || "Professional"
  });

  // Example: Add static assets (logo, icon)
  // pass.addBuffer('icon.png', iconBuffer);
  // pass.addBuffer('logo.png', logoBuffer);

  const buffer = await pass.getAsBuffer();
  return buffer.toString('base64');
}

/**
 * Endpoint to generate an Apple Wallet pass (.pkpass).
 * Must be called by an authenticated user.
 */
exports.generateAppleWalletPass = onCall({ 
  region: 'us-central1',
  secrets: [appleWWDRCert, appleSignerCert, appleSignerKey, appleSignerKeyPassphrase] 
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to generate a wallet pass.');
  }

  const uid = request.auth.uid;
  const db = admin.firestore();
  
  try {
    // 1. Fetch user data to populate the pass
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found.');
    }
    
    const userData = userDoc.data();
    
    // 2. Generate the pass using secure secrets
    const passBase64 = await generateAppleWalletPassLogic({
      name: userData.displayName || 'SiteHub User',
      title: userData.jobTitle || 'Professional',
      profileUrl: `https://sitehub.app/p/${uid}` // Example public profile URL
    }, {
      wwdr: appleWWDRCert.value(),
      signerCert: appleSignerCert.value(),
      signerKey: appleSignerKey.value(),
      signerKeyPassphrase: appleSignerKeyPassphrase.value()
    });

    // 3. Return the base64 encoded .pkpass file
    return { 
      success: true, 
      passBase64: passBase64 
    };
  } catch (error) {
    console.error('[generateAppleWalletPass] Error:', error);
    throw new HttpsError('internal', 'Failed to generate Apple Wallet pass.', error.message);
  }
});

/**
 * Endpoint to generate a Google Wallet "Add to Wallet" link.
 * Requires GOOGLE_WALLET_CREDENTIALS secret.
 */
exports.generateGoogleWalletPass = onCall({
  region: 'us-central1',
  secrets: [googleWalletCredentials]
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to generate a wallet pass.');
  }

  const uid = request.auth.uid;
  
  try {
    // 1. Load Google APIs
    const { google } = require('googleapis');
    
    // 2. Parse credentials securely injected at runtime
    const credentials = JSON.parse(googleWalletCredentials.value());
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/wallet_object.issuer']
    );

    // Note: To fully implement this, you need to define a GenericClass 
    // in the Google Pay & Wallet Console first.
    const issuerId = credentials.issuer_id; // Added to credentials JSON manually
    const classId = `${issuerId}.SiteHubBusinessCard`;
    const objectId = `${issuerId}.${uid}`;

    // 3. Define the GenericObject (The user's specific card)
    const newObject = {
      id: objectId,
      classId: classId,
      state: 'ACTIVE',
      heroImage: {
        sourceUri: {
          uri: 'https://sitehub.app/assets/wallet-hero.png'
        }
      },
      textModulesData: [
        {
          header: 'Name',
          body: 'SiteHub User',
          id: 'name'
        }
      ],
      barcode: {
        type: 'QR_CODE',
        value: `https://sitehub.app/p/${uid}`
      }
    };

    const jwt = require('jsonwebtoken');

    // 4. Generate the signed JWT link
    const claims = {
      iss: credentials.client_email,
      aud: 'google',
      origins: ['https://sitehub.app'],
      typ: 'savetowallet',
      payload: {
        genericObjects: [newObject]
      }
    };

    const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' });
    
    return {
      success: true,
      googleWalletUrl: `https://pay.google.com/gp/v/save/${token}`
    };
  } catch (error) {
    console.error('[generateGoogleWalletPass] Error:', error);
    throw new HttpsError('internal', 'Failed to generate Google Wallet link.', error.message);
  }
});
