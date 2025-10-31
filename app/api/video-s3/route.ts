import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');
    
    if (!videoUrl) {
      return new NextResponse('Video URL required', { status: 400 });
    }

    // Get Range header from client request
    const range = request.headers.get('range');
    const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    // Prepare headers for S3 request
    const fetchHeaders: Record<string, string> = {
      'User-Agent': userAgent
    };

    // Forward Range header if present
    if (range) {
      fetchHeaders['Range'] = range;
    }

    // Fetch video from S3
    const response = await fetch(videoUrl, {
      headers: fetchHeaders
    });

    if (!response.ok) {
      return new NextResponse('Video not found', { status: response.status });
    }

    // Prepare response headers
    const responseHeaders: Record<string, string> = {
      'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range',
      'Cache-Control': 'public, max-age=3600'
    };

    // Forward important headers from S3 response
    const contentLength = response.headers.get('Content-Length');
    const contentRange = response.headers.get('Content-Range');
    const lastModified = response.headers.get('Last-Modified');
    const etag = response.headers.get('ETag');

    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    if (contentRange) responseHeaders['Content-Range'] = contentRange;
    if (lastModified) responseHeaders['Last-Modified'] = lastModified;
    if (etag) responseHeaders['ETag'] = etag;

    // Return with appropriate status code
    const status = response.status === 206 ? 206 : 200;
    
    return new NextResponse(response.body, {
      status,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Error in video S3 proxy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range',
      'Access-Control-Max-Age': '86400',
    },
  });
}