export async function getTokenFromApi() {
  const response = await fetch('/api/get-aad-token');
  // console.log('Response:', response);
  const data = await response.json();
  // console.log('Token data:', data);
  return data;
}