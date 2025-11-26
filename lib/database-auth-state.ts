/**
 * Database-backed Authentication State for Baileys WhatsApp
 *
 * This replaces file-based auth storage with database storage,
 * solving the issue of losing WhatsApp sessions on deployments.
 *
 * Railway and other cloud platforms use ephemeral file systems,
 * so storing auth state in the database ensures persistence.
 */

import { AuthenticationState, SignalDataTypeMap, initAuthCreds } from '@whiskeysockets/baileys';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { proto } from '@whiskeysockets/baileys';

export interface DatabaseAuthState {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}

/**
 * Helper function to convert JSON-serialized Buffers back to actual Buffer objects
 * When Buffers are saved to JSON, they become { type: 'Buffer', data: [1,2,3,...] }
 * This function recursively walks the object and converts them back
 */
function deserializeBuffers(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Check if this is a serialized Buffer
  if (
    obj &&
    typeof obj === 'object' &&
    obj.type === 'Buffer' &&
    Array.isArray(obj.data)
  ) {
    return Buffer.from(obj.data);
  }

  // If it's an array, recursively process each element
  if (Array.isArray(obj)) {
    return obj.map(item => deserializeBuffers(item));
  }

  // If it's an object, recursively process each property
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializeBuffers(value);
    }
    return result;
  }

  // For primitives, return as-is
  return obj;
}

/**
 * Create a database-backed auth state for WhatsApp
 * This persists authentication across deployments
 */
export async function useDatabaseAuthState(agentId: string): Promise<DatabaseAuthState> {
  // Find the WhatsApp connection for this agent
  let connection = await prisma.whatsAppConnection.findFirst({
    where: { agentId },
  });

  // Initialize auth state
  let creds: AuthenticationState['creds'];
  let keys: Record<string, any> = {};

  if (connection?.sessionData) {
    // Load existing session from database
    try {
      const sessionData = connection.sessionData as any;

      console.log(`📥 Loading session from database for agent ${agentId}...`);

      // Parse stored credentials and deserialize Buffers
      if (sessionData.creds) {
        console.log('🔄 Deserializing credentials from database...');
        creds = deserializeBuffers(sessionData.creds);
        console.log('✅ Credentials deserialized successfully');
      } else {
        console.log('⚠️ No credentials found in session data, initializing new');
        creds = initAuthCreds();
      }

      // Parse stored keys and deserialize Buffers
      if (sessionData.keys) {
        console.log('🔄 Deserializing keys from database...');
        keys = deserializeBuffers(sessionData.keys);
        const keyCount = Object.keys(keys).length;
        console.log(`✅ Keys deserialized successfully (${keyCount} keys)`);

        // CRITICAL: If credentials exist but no keys, session is corrupted (from before auto-save was added)
        // Clear it and start fresh with new QR code
        if (keyCount === 0 && sessionData.creds) {
          console.log('⚠️ DETECTED CORRUPTED SESSION: Credentials exist but no signal keys!');
          console.log('🗑️ This is old session data from before auto-save fix was deployed');
          console.log('🔄 Clearing corrupted session and starting fresh...');

          // Clear the corrupted session
          await prisma.whatsAppConnection.updateMany({
            where: { agentId },
            data: {
              sessionData: null as any,
              isConnected: false,
            },
          });

          // Start fresh with new credentials
          creds = initAuthCreds();
          keys = {};
          console.log('✅ Cleared corrupted session - will generate new QR code');
          console.log(`🆕 Initialized new WhatsApp session for agent ${agentId}`);
        } else {
          console.log(`✅ Loaded existing WhatsApp session from database for agent ${agentId}`);
        }
      } else {
        console.log(`✅ Loaded existing WhatsApp session from database for agent ${agentId}`);
      }
    } catch (error) {
      console.error(`Error loading session from database:`, error);
      console.error(`Error details:`, error instanceof Error ? error.message : String(error));
      console.log('⚠️ Falling back to new credentials');
      creds = initAuthCreds();
    }
  } else {
    // Initialize new credentials
    creds = initAuthCreds();
    console.log(`🆕 Initialized new WhatsApp session for agent ${agentId}`);
  }

  // Create auth state
  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type: string, ids: string[]) => {
        const data: Record<string, any> = {};
        for (const id of ids) {
          const key = `${type}-${id}`;
          if (keys[key]) {
            data[id] = keys[key];
          }
        }
        return data;
      },
      set: async (data: Record<string, SignalDataTypeMap[keyof SignalDataTypeMap]>) => {
        const keysBefore = Object.keys(keys).length;
        for (const [key, value] of Object.entries(data)) {
          keys[key] = value;
        }
        const keysAfter = Object.keys(keys).length;
        console.log(`🔑 Keys updated for agent ${agentId}: ${keysBefore} → ${keysAfter} keys`);

        // Auto-save keys whenever they're updated
        console.log('💾 Auto-saving keys after update...');
        await saveCreds();
      },
    },
  };

  // Function to save credentials and keys to database
  const saveCreds = async () => {
    try {
      const keyCount = Object.keys(keys).length;
      console.log(`🔄 Attempting to save credentials for agent ${agentId}...`);
      console.log(`📊 Current state: ${keyCount} keys in memory`);

      // Prepare session data
      const sessionData = {
        creds: state.creds,
        keys: keys,
      };

      // Update or create connection with new session data
      if (connection) {
        console.log(`📝 Updating connection ID: ${connection.id}`);
        console.log(`💾 Saving ${keyCount} keys to database...`);
        await prisma.whatsAppConnection.update({
          where: { id: connection.id },
          data: { sessionData: sessionData as any },
        });
        console.log(`✅ Successfully saved WhatsApp session to database for agent ${agentId}`);
        console.log(`✅ Saved credentials with ${keyCount} keys`);
      } else {
        // Re-fetch connection in case it was created after we started
        console.log('⚠️ Connection reference is null, re-fetching from database...');
        connection = await prisma.whatsAppConnection.findFirst({
          where: { agentId },
        });

        if (connection) {
          console.log(`📝 Found connection ID: ${connection.id}`);
          console.log(`💾 Saving ${keyCount} keys to database...`);
          await prisma.whatsAppConnection.update({
            where: { id: connection.id },
            data: { sessionData: sessionData as any },
          });
          console.log(`✅ Successfully saved WhatsApp session to database for agent ${agentId}`);
          console.log(`✅ Saved credentials with ${keyCount} keys`);
        } else {
          console.error(`⚠️ No connection found for agent ${agentId}, cannot save session!`);
          console.error(`⚠️ This means the WhatsAppConnection record doesn't exist in database`);
        }
      }
    } catch (error) {
      console.error(`❌ Error saving session to database for agent ${agentId}:`, error);
      console.error(`❌ Error details:`, error);
    }
  };

  return { state, saveCreds };
}

/**
 * Clear session data from database
 * Use when disconnecting or resetting a connection
 */
export async function clearDatabaseAuthState(agentId: string): Promise<void> {
  try {
    await prisma.whatsAppConnection.updateMany({
      where: { agentId },
      data: {
        sessionData: null as any,
        isConnected: false,
      },
    });
    console.log(`🗑️ Cleared WhatsApp session from database for agent ${agentId}`);
  } catch (error) {
    console.error(`❌ Error clearing session from database:`, error);
  }
}
