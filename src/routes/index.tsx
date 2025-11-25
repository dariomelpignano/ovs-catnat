import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";

export default function Home() {
  const navigate = useNavigate();

  onMount(() => {
    authStore.restoreSession();
    if (authStore.isAuthenticated()) {
      navigate(authStore.isAdmin() || authStore.isBroker() ? "/admin" : "/store", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  });

  return <div class="loading"><p>Redirecting...</p></div>;
}
