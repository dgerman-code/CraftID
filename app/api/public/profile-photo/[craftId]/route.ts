import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ craftId: string }> };

const notFound = () => new NextResponse("Not found", { status: 404 });

// Serves the public photo of a published CraftID without ever handing the
// storage path to the client. The object name is resolved server-side and the
// bytes are streamed from the private profile-images bucket, which the visitor
// may read only for this one object and only while the owner keeps the photo
// toggle on.
export async function GET(_request: Request, { params }: Props) {
  const { craftId } = await params;
  const parsed = parseCraftId(craftId);

  // A malformed or MOD-97-invalid CraftID is indistinguishable from a missing
  // one, so the route reveals nothing about which identifiers exist.
  if (!parsed) return notFound();

  const supabase = await createClient();
  const { data: objectName } = await supabase.rpc("public_profile_photo_object", {
    p_craftid_number: parsed.number,
    p_check_digits: parsed.check,
  });

  if (typeof objectName !== "string" || objectName.length === 0) return notFound();

  const { data: file, error } = await supabase.storage.from("profile-images").download(objectName);
  if (error || !file) return notFound();

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": file.type || "image/jpeg",
      // Kept short so revoking the photo toggle takes effect quickly.
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Content-Disposition": "inline",
      "X-Robots-Tag": "noindex",
    },
  });
}
