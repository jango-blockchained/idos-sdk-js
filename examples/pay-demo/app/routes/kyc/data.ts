import { userContext } from "~/middlewares/auth";
import { getSharedCredential } from "~/providers/idos.server";
import type { Route } from "./+types/data";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialId = url.searchParams.get("credentialId");
  const user = context.get(userContext);

  if (!credentialId || !user) {
    return Response.json({ error: "credentialId or user is required" }, { status: 400 });
  }

  try {
    const data = await getSharedCredential(credentialId, user.address);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
