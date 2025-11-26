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

      // Parse stored credentials
      if (sessionData.creds) {
        creds = sessionData.creds;
      } else {
        creds = initAuthCreds();
      }

      // Parse stored keys
      if (sessionData.keys) {
        keys = sessionData.keys;
      }

      console.log(`✅ Loaded existing WhatsApp session from database for agent ${agentId}`);
    } catch (error) {
      console.error(`Error loading session from database:`, error);
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
        for (const [key, value] of Object.entries(data)) {
          keys[key] = value;
        }
      },
    },
  };

  // Function to save credentials and keys to database
  const saveCreds = async () => {
    try {
      // Prepare session data
      const sessionData = {
        creds: state.creds,
        keys: keys,
      };

      // Update or create connection with new session data
      if (connection) {
        await prisma.whatsAppConnection.update({
          where: { id: connection.id },
          data: { sessionData: sessionData as any },
        });
      } else {
        // This shouldn't happen, but handle it gracefully
        console.warn(`⚠️ No connection found for agent ${agentId}, skipping session save`);
      }

      console.log(`💾 Saved WhatsApp session to database for agent ${agentId}`);
    } catch (error) {
      console.error(`❌ Error saving session to database:`, error);
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
