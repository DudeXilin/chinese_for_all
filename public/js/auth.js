/* Profile button for the static homepage (public/index.html).

   Login and registration happen on the existing Next.js pages
   (/auth/login, /auth/sign-up) - those use the SSR Supabase client,
   which stores the session in cookies. This file just asks the server
   (/api/session) whether those cookies represent a logged-in user,
   since a plain browser Supabase client here would use different
   storage and never see that session. */

(function () {
  "use strict";

  var PERSON_ICON =
    '<svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9z"/></svg>';

  function el(id) {
    return document.getElementById(id);
  }

  function togglePanel(forceOpen) {
    var panel = el("cfa-profile-dropdown");
    var isOpen = panel.classList.contains("cfa-open");
    var open = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
    panel.classList.toggle("cfa-open", open);
    el("cfa-profile-button").setAttribute("aria-expanded", String(open));
  }

  function showLoggedOut() {
    el("cfa-profile-icon").innerHTML = PERSON_ICON;
    el("cfa-profile-button").onclick = function (e) {
      e.stopPropagation();
      togglePanel();
    };
  }

  function showLoggedIn(nickname, email) {
    var label = nickname || email || "?";
    el("cfa-profile-icon").textContent =
      label.trim().charAt(0).toUpperCase() || "?";
    el("cfa-profile-button").onclick = function () {
      window.location.href = "/profile";
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = el("cfa-profile-button");
    if (!button) return;

    document.addEventListener("click", function (e) {
      var dropdown = el("cfa-profile-dropdown");
      if (dropdown.contains(e.target) || button.contains(e.target)) return;
      togglePanel(false);
    });

    fetch("/api/session")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.loggedIn) {
          showLoggedIn(data.nickname, data.email);
        } else {
          showLoggedOut();
        }
      })
      .catch(function () {
        showLoggedOut();
      });
  });
})();
