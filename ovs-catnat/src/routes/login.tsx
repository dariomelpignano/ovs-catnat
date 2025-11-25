// =============================================================================
// Login Page
// =============================================================================

import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    const success = await authStore.login(email(), password());

    if (success) {
      if (authStore.isAdmin() || authStore.isBroker()) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/store", { replace: true });
      }
    } else {
      setError("Credenziali non valide");
    }
  };

  return (
    <div class="login-page">
      <div class="login-container">
        <div class="login-header">
          <h1 class="login-logo">OVS CatNat</h1>
          <p class="login-subtitle">Gestione Polizze Property & Catastrofi Naturali</p>
        </div>

        <form class="login-form" onSubmit={handleSubmit}>
          <Show when={error()}>
            <div class="login-error">{error()}</div>
          </Show>

          <div class="form-group">
            <label class="form-label" for="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              class="form-input"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              placeholder="nome@esempio.it"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              class="form-input"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary login-btn"
            disabled={authStore.isLoading()}
          >
            {authStore.isLoading() ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <div class="login-footer">
          <p class="login-help">
            Problemi di accesso? Contatta{" "}
            <a href="mailto:support@mag.it">support@mag.it</a>
          </p>
        </div>

        {/* Demo credentials hint - remove in production */}
        <div class="login-demo">
          <p><strong>Demo:</strong></p>
          <p>Admin: admin@mag.it / demo123</p>
          <p>Store: store001@ovs.it / demo123</p>
        </div>
      </div>
    </div>
  );
}
