export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const employeeId = searchParams.get("employeeId");

    const token = request.cookies.get("authToken")?.value;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/attendance/clockout?companyId=${companyId}}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId }),
      },
    );
    const FetchDetails = await response.json();
    return Response.json(FetchDetails, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch user data" },
      { status: 500 },
    );
  }
}
