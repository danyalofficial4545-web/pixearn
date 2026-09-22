import { supabase } from "@/integrations/supabase/client";

/** Uploads a proof screenshot into the caller's own folder and returns the storage path. */
export async function uploadProof(file: File) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("proofs").upload(path, file);
  if (error) throw new Error(error.message);
  return path;
}
