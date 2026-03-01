import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const OutResponse = NextResponse.json({ success: true });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    OutResponse.cookies.set("authToken", data.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });
    OutResponse.cookies.set("userData", JSON.stringify(data), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });
    
    return OutResponse;

  } catch (error) {
    return Response.json(
      { error: "Failed to fetch external API" },
      { status: 500 }
    );
  }
}