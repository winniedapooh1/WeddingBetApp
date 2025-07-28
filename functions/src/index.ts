// WeddingBetApp/functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (Cloud Functions usually do this automatically)
admin.initializeApp();

// Define an interface for the expected data payload for addAdminRole
interface AddAdminRoleData {
  email: string;
}

/**
 * HTTP callable function to set a user as an admin.
 *
 * IMPORTANT: In a production environment, this function MUST be protected.
 * For example, only callable by a super-admin (whose UID is hardcoded or
 * checked against a secure list), or from a dedicated, authenticated admin panel.
 * For initial setup, you might temporarily allow it for your own UID, then lock it down.
 */
export const addAdminRole = functions.https.onCall(async (
  request: functions.https.CallableRequest<AddAdminRoleData>
) => {
  // Access auth context via request.auth
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated users can set admin roles.'
    );
  }

  // 2. Authorization Check (CRUCIAL for production):
  //    Verify if the user calling this function is authorized to set admin roles.
  //    Access the superAdminUid from Firebase Functions runtime config
  const superAdminUid = functions.config().admin.uid; // <-- MODIFIED: Access from functions.config()

  if (request.auth.uid !== superAdminUid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have permission to assign admin roles.'
    );
  }

  // Get the target user's email from the request data
  const email = request.data.email;
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with an email address.'
    );
  }

  try {
    // Get the user record by email
    const user = await admin.auth().getUserByEmail(email);
    // Set the custom user claim 'admin' to true for this user
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // Return a success message
    return { message: `Success! ${email} has been made an admin.` };

  } catch (error: any) {
    console.error('Error setting admin claim:', error);
    if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError(
            'not-found',
            'No user found for the provided email address.'
        );
    }
    throw new functions.https.HttpsError('internal', 'Failed to set admin role.', error.message);
  }
});

// Define an interface for the expected data payload for removeAdminRole
interface RemoveAdminRoleData {
  email: string;
}

/**
 * HTTP callable function to remove admin role from a user.
 * Also needs strong authorization checks.
 */
export const removeAdminRole = functions.https.onCall(async (
  request: functions.https.CallableRequest<RemoveAdminRoleData>
) => {
  // Access auth context via request.auth
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Only authenticated users can remove admin roles.');
  }

  // Access the superAdminUid from Firebase Functions runtime config
  const superAdminUid = functions.config().admin.uid; // <-- MODIFIED: Access from functions.config()

  if (request.auth.uid !== superAdminUid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have permission to remove admin roles.'
    );
  }

  const email = request.data.email;
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an email address.');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    // Set custom user claim 'admin' to false (or null/undefined to remove it)
    await admin.auth().setCustomUserClaims(user.uid, { admin: false }); // Or simply omit the 'admin' claim

    return { message: `Success! ${email} no longer has admin role.` };
  } catch (error: any) {
    console.error('Error removing admin claim:', error);
    throw new functions.https.HttpsError('internal', 'Failed to remove admin role.', error.message);
  }
});