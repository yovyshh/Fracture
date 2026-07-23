import { redirect } from "next/navigation";

/** Legacy route → Inference workspace */
export default function UploadRedirect() {
  redirect("/inference");
}
