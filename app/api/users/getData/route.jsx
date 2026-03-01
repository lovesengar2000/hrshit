export async function GET(request) {
    try{
        const token = request.cookies.get("userData")?.value;
       return Response.json( token , { status: 200 });
    }
    catch(error){
        return Response.json(
            { error: "Failed to fetch user data" },
            { status: 500 }
        );
    }
}