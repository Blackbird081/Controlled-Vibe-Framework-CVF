

const BASE_URL = "http://localhost:4000";

export async function apiPost<T>(
  path: string,
  body: any
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("API error");
  }

  return res.json();
}

export async function apiGet<T>(
  path: string
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);

  if (!res.ok) {
    throw new Error("API error");
  }

  return res.json();
}