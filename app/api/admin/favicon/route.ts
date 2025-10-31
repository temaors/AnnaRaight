import { NextRequest, NextResponse } from 'next/server';
import { writeFile, copyFile, existsSync } from 'fs';
import { promisify } from 'util';
import path from 'path';

const writeFileAsync = promisify(writeFile);
const copyFileAsync = promisify(copyFile);

// GET - Get current favicon info
export async function GET() {
  try {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    const exists = existsSync(faviconPath);
    
    return NextResponse.json({
      success: true,
      data: {
        exists,
        path: '/favicon.ico',
        lastModified: exists ? new Date().toISOString() : null
      }
    });
  } catch (error) {
    console.error('Error getting favicon info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get favicon info' },
      { status: 500 }
    );
  }
}

// POST - Upload new favicon
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('favicon') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload ICO, PNG, or JPG file.' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 1MB.' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Define paths
    const publicDir = path.join(process.cwd(), 'public');
    const faviconPath = path.join(publicDir, 'favicon.ico');
    const backupPath = path.join(publicDir, 'favicon-backup.ico');
    
    // Backup existing favicon if it exists
    if (existsSync(faviconPath)) {
      try {
        await copyFileAsync(faviconPath, backupPath);
        console.log('✅ Existing favicon backed up');
      } catch (backupError) {
        console.warn('⚠️ Could not backup existing favicon:', backupError);
      }
    }
    
    // Write new favicon
    await writeFileAsync(faviconPath, buffer);
    
    console.log('✅ New favicon uploaded successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Favicon uploaded successfully',
      data: {
        filename: 'favicon.ico',
        size: file.size,
        type: file.type,
        path: '/favicon.ico'
      }
    });
    
  } catch (error) {
    console.error('Error uploading favicon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload favicon', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Restore backup favicon
export async function DELETE() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const faviconPath = path.join(publicDir, 'favicon.ico');
    const backupPath = path.join(publicDir, 'favicon-backup.ico');
    
    if (!existsSync(backupPath)) {
      return NextResponse.json(
        { success: false, error: 'No backup favicon found' },
        { status: 404 }
      );
    }
    
    // Restore backup
    await copyFileAsync(backupPath, faviconPath);
    
    console.log('✅ Favicon restored from backup');
    
    return NextResponse.json({
      success: true,
      message: 'Favicon restored from backup successfully'
    });
    
  } catch (error) {
    console.error('Error restoring favicon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore favicon' },
      { status: 500 }
    );
  }
}