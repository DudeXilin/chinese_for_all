/* Profile button + Supabase Auth wiring for the static homepage
   (public/index.html). Login and registration themselves stay on the
   existing Next.js pages (/auth/login, /auth/sign-up) - this file only
   decides what the top-right button/panel should show. */

(function () {
  "use strict";

  var supabaseClient = null;

  async function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    var res = await fetch("/api/config");
    var config = await res.json();

    if (!config.url || !config.anonKey) {
      console.warn(
        "Supabase is not configured yet (missing env vars) - profile button will show the logged-out state."
      );
      return null;
    }

    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    return supabaseClient;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function showLoggedOut() {
    el("cfa-profile-icon").textContent = "";
    el("cfa-profile-panel-guest").style.display = "block";
    el("cfa-profile-panel-user").style.display = "none";
  }

  function showLoggedIn(nickname) {
    var initial = (nickname || "?").trim().charAt(0).toUpperCase() || "?";
    el("cfa-profile-icon").textContent = initial;
    el("cfa-profile-nickname").textContent = nickname || "Без никнейма";
    el("cfa-profile-panel-guest").style.display = "none";
    el("cfa-profile-panel-user").style.display = "block";
  }

  async function loadProfile(client, user) {
    if (!user) {
      showLoggedOut();
      return;
    }

    var nickname = "";
    try {
      var { data } = await client
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();
      nickname = (data && data.nickname) || user.email || "";
    } catch {
      nickname = user.email || "";
    }

    showLoggedIn(nickname);
  }

  function togglePanel(forceOpen) {
    var panel = el("cfa-profile-dropdown");
    var isOpen = panel.classList.contains("cfa-open");
    var open = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
    panel.classList.toggle("cfa-open", open);
    el("cfa-profile-button").setAttribute("aria-expanded", String(open));
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var button = el("cfa-profile-button");
    if (!button) return;

    button.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePanel();
    });

    document.addEventListener("click", function (e) {
      var dropdown = el("cfa-profile-dropdown");
      if (dropdown.contains(e.target) || button.contains(e.target)) return;
      togglePanel(false);
    });

    var client = await getSupabaseClient();
    if (!client) {
      showLoggedOut();
      return;
    }

    var logoutBtn = el("cfa-profile-logout");
    logoutBtn.addEventListener("click", async function () {
      await client.auth.signOut();
      window.location.reload();
    });

    var { data: sessionData } = await client.auth.getSession();
    await loadProfile(client, sessionData.session ? sessionData.session.user : null);

    client.auth.onAuthStateChange(function (_event, session) {
      loadProfile(client, session ? session.user : null);
    });
  });
})();
