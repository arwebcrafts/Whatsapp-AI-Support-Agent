import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const checks = {
      dataExists: fs.existsSync('/data'),
      dataIsDirectory: false,
      dataContents: [] as string[],
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

    return NextResponse.json({
      success: true,
      volumeDetected: checks.dataExists && checks.dataIsDirectory,
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
