import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const checks: any = {
      dataExists: fs.existsSync('/data'),
      dataIsDirectory: false,
      dataContents: [] as string[],
      dataWritable: false,
      whatsappSessionsExists: false,
      whatsappSessionsContents: [] as string[],
      sessionFilesCount: 0,
      workspaceExists: fs.existsSync('/workspace'),
      currentDir: process.cwd(),
      sessionDir: '',
    };

    if (checks.dataExists) {
      try {
        const stat = fs.statSync('/data');
        checks.dataIsDirectory = stat.isDirectory();

        if (checks.dataIsDirectory) {
          checks.dataContents = fs.readdirSync('/data');

          // Test if writable
          try {
            const testFile = path.join('/data', '.write_test_debug');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            checks.dataWritable = true;
          } catch (e) {
            checks.dataWritable = false;
          }
        }
      } catch (error) {
        console.error('Error checking /data:', error);
      }
    }

    // Check where sessions would be stored
    if (fs.existsSync('/data')) {
      checks.sessionDir = '/data/whatsapp_sessions';
    } else {
      checks.sessionDir = path.join(process.cwd(), 'whatsapp_sessions');
    }

    // Check whatsapp_sessions directory
    if (fs.existsSync(checks.sessionDir)) {
      checks.whatsappSessionsExists = true;
      try {
        const sessions = fs.readdirSync(checks.sessionDir);
        checks.whatsappSessionsContents = sessions;

        // Count total files in all session directories
        sessions.forEach(agentId => {
          const agentDir = path.join(checks.sessionDir, agentId);
          if (fs.existsSync(agentDir) && fs.statSync(agentDir).isDirectory()) {
            const files = fs.readdirSync(agentDir);
            checks.sessionFilesCount += files.length;
          }
        });
      } catch (e) {
        console.error('Error reading session dir:', e);
      }
    }

    return NextResponse.json({
      success: true,
      volumeDetected: checks.dataExists && checks.dataIsDirectory,
      volumeWritable: checks.dataWritable,
      sessionsInVolume: checks.whatsappSessionsExists && checks.sessionDir.startsWith('/data'),
      details: checks,
      envVars: {
        RAILWAY_STATIC_URL: !!process.env.RAILWAY_STATIC_URL,
        RAILWAY_PROJECT_ID: !!process.env.RAILWAY_PROJECT_ID,
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
