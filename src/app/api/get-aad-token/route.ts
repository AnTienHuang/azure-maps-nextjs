import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientSecret = process.env.AZURE_AD_APPLICATION_CLIENT_SECRET;
  const clientId = process.env.AZURE_AD_APPLICATION_CLIENT_ID;
  if (!tenantId || !clientSecret || !clientId) {
    throw new Error('Missing required environment variables');
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = [
    'grant_type=client_credentials',
    `client_id=${encodeURIComponent(clientId)}`,
    `client_secret=${encodeURIComponent(clientSecret)}`,
    'scope=https://atlas.microsoft.com/.default'
  ].join('&');

  try {
    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // console.log('get-aad-token response:', response.data);
    return NextResponse.json({ status: 200, access_token: response.data.access_token});
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json({ message: `Failed to get token, ${error}`, status: 500});
  }
}