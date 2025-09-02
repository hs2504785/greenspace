import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate that it's a Google Maps shortened link
    if (!url.includes('maps.app.goo.gl') && !url.includes('goo.gl/maps')) {
      return NextResponse.json({ error: 'Only Google Maps shortened links are supported' }, { status: 400 });
    }

    console.log('Attempting to expand URL:', url);

    // Use fetch with redirect: 'manual' to get the redirect location
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual'
    });

    let expandedUrl = null;

    // Check for redirect response
    if (response.status >= 300 && response.status < 400) {
      expandedUrl = response.headers.get('location');
    } else if (response.status === 200) {
      // Sometimes the URL might already be expanded or the service follows redirects
      expandedUrl = url;
    }

    if (expandedUrl) {
      console.log('Successfully expanded URL:', expandedUrl);
      return NextResponse.json({ 
        originalUrl: url,
        expandedUrl: expandedUrl 
      });
    } else {
      console.log('Could not expand URL, no redirect found');
      return NextResponse.json({ 
        error: 'Could not expand URL',
        originalUrl: url 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error expanding URL:', error);
    return NextResponse.json({ 
      error: 'Failed to expand URL',
      details: error.message 
    }, { status: 500 });
  }
}
