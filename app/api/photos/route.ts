import { createApi } from 'unsplash-js';
import { NextResponse } from 'next/server';
import nodeFetch from 'node-fetch';

interface UnsplashResponse {
  type: string;
  response: {
    results: Array<{
      id: string;
      urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
      };
      description: string | null;
      user: {
        name: string;
      };
    }>;
  };
}

const unsplash = createApi({
  accessKey: 'gekGPNspSMkLv7gpmu5HoxwLOF53gy5Jf7OM3dzI9tA',
  fetch: nodeFetch as unknown as typeof fetch,
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout

    const result = await unsplash.photos.list({
      page,
      perPage: 8,
    }) as UnsplashResponse;

    clearTimeout(timeoutId);

    if (result.type === 'success') {
      return NextResponse.json(result.response);
    } else {
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 