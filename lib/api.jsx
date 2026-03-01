export async function getUserData() {
  const res = await fetch("/api/users/getData", {
    credentials: "include",
  });

  return  await res.json();
}