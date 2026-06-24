import { redirect } from "next/navigation";

// kizu is invite-only / app-first — the root just sends you into the app,
// which bounces to /login (then /groups/new) if you're not set up yet.
export default function Home() {
  redirect("/home");
}
