export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/checkEmail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    return Response.json(data, { status: response.status });

  } catch (error) {
    return Response.json(
      { error: "Failed to fetch external API" },
      { status: 500 }
    );
  }
}