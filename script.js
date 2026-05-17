const params = new URLSearchParams(window.location.search);
let variant = (params.get("v") || "A").toUpperCase();

if (variant !== "A" && variant !== "B") {
  variant = "A";
}

document.body.classList.add(`variant-${variant}`);

const overlay = document.getElementById("overlay");

const banner = document.getElementById("banner");
const bannerTitle = document.getElementById("bannerTitle");
const bannerText = document.getElementById("bannerText");
const bannerActions = document.getElementById("bannerActions");

const settings = document.getElementById("settings");
const settingsTitle = document.getElementById("settingsTitle");
const settingsText = document.getElementById("settingsText");
const settingsList = document.getElementById("settingsList");
const settingsActions = document.getElementById("settingsActions");

let shownAt = null;
let savedScrollY = 0;

/* ==========================
   BLOQUEO DE SCROLL
========================== */

function lockPageScroll() {
  savedScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.classList.add("noscroll");
  document.body.style.top = `-${savedScrollY}px`;
}

function unlockPageScroll() {
  document.body.classList.remove("noscroll");
  document.body.style.top = "";
  window.scrollTo(0, savedScrollY);
}

function clearActiveFocus() {
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
}

/* ==========================
   TIEMPO DE DECISIÓN
========================== */

function getDecisionTime() {
  if (!shownAt) {
    return {
      decision_time_ms: 0,
      decision_time_s: 0
    };
  }

  const decisionTimeMs = Date.now() - shownAt;
  const decisionTimeS = Math.round((decisionTimeMs / 1000) * 10) / 10;

  return {
    decision_time_ms: decisionTimeMs,
    decision_time_s: decisionTimeS
  };
}

/* ==========================
   LOG LOCAL + GOOGLE ANALYTICS
========================== */

function logEvent(action, extra = {}) {
  const time = getDecisionTime();

  const entry = {
    ts: new Date().toISOString(),
    variant,
    action,
    ...time,
    ...extra
  };

  const key = "gane_ab_logs";
  const prev = JSON.parse(localStorage.getItem(key) || "[]");

  prev.push(entry);
  localStorage.setItem(key, JSON.stringify(prev));

  console.log("LOG:", entry);
}

function trackGA(eventName, extra = {}) {
  if (typeof gtag === "function") {
    const time = getDecisionTime();

    gtag("event", eventName, {
      variant,
      ...time,
      ...extra
    });
  }
}

/* ==========================
   ABRIR / CERRAR
========================== */

function openBanner() {
  shownAt = Date.now();

  settings.classList.add("hidden");
  settings.setAttribute("aria-hidden", "true");

  if (variant === "A") {
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  } else {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }

  lockPageScroll();

  banner.classList.remove("hidden");
  banner.setAttribute("aria-hidden", "false");

  renderBanner();

  logEvent("view_experiment", {
    layer: "first_layer"
  });

  trackGA("view_experiment", {
    layer: "first_layer"
  });
}

function closeAll() {
  clearActiveFocus();

  banner.classList.add("hidden");
  banner.setAttribute("aria-hidden", "true");

  settings.classList.add("hidden");
  settings.setAttribute("aria-hidden", "true");

  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");

  if (document.body.classList.contains("noscroll")) {
    unlockPageScroll();
  }
}

function openSettings() {
  clearActiveFocus();

  banner.classList.add("hidden");
  banner.setAttribute("aria-hidden", "true");

  settings.classList.remove("hidden");
  settings.setAttribute("aria-hidden", "false");

  renderSettings();

  settings.scrollTop = 0;

  requestAnimationFrame(() => {
    settings.scrollTop = 0;
  });
}

/* ==========================
   PRIMERA CAPA
========================== */

function renderBanner() {
  bannerActions.innerHTML = "";
  bannerTitle.textContent = "PREFERENCIAS DE COOKIES";

  if (variant === "A") {
    bannerText.innerHTML = `
      Usamos cookies para mejorar tu experiencia y analizar el uso de la web.
      Puedes aceptar o <button type="button" id="inlineConfigDynamic" class="inline-link">configurar</button> tus preferencias.
    `;

    const accept = makeBtn("ACEPTAR", "accept", true);
    bannerActions.appendChild(accept);

    const inlineConfigDynamic = document.getElementById("inlineConfigDynamic");

    inlineConfigDynamic?.addEventListener("click", () => {
      handleAction("config", "configurar");
    });
  } else {
    bannerText.textContent =
      "Antes de seguir, puedes elegir cómo quieres que usemos las cookies. Algunas son necesarias para que la web funcione y otras nos ayudan a entender el uso de la página.";

    bannerActions.appendChild(makeBtn("RECHAZAR", "reject", false));
    bannerActions.appendChild(makeBtn("CONFIGURAR", "config", false));
    bannerActions.appendChild(makeBtn("ACEPTAR", "accept", false));
  }
}

/* ==========================
   SEGUNDA CAPA / CONFIGURACIÓN
========================== */

function renderSettings() {
  settingsActions.innerHTML = "";

  const categoriesA = [
    {
      name: "Cookies necesarias o técnicas",
      desc: "Permiten funciones básicas del sitio y no pueden desactivarse.",
      required: true
    },
    {
      name: "Cookies funcionales",
      desc: "Ayudan a habilitar servicios adicionales y mejorar determinadas funciones.",
      required: false
    },
    {
      name: "Cookies de preferencias o personalización",
      desc: "Permiten recordar ajustes y ofrecer una navegación más adaptada.",
      required: false
    },
    {
      name: "Cookies analíticas o estadísticas",
      desc: "Nos ayudan a medir el uso de la web y optimizar su funcionamiento.",
      required: false
    },
    {
      name: "Cookies de marketing o publicidad",
      desc: "Permiten mostrar contenido y anuncios más relevantes para el usuario.",
      required: false
    },
    {
      name: "Cookies de terceros o proveedores externos",
      desc: "Algunos servicios pueden trabajar con socios externos para análisis, contenido integrado o publicidad.",
      required: false
    }
  ];

  const categoriesB = [
    {
      name: "Cookies necesarias o técnicas",
      desc: "Son imprescindibles para que la web funcione correctamente, por ejemplo para mantener la sesión abierta o recordar una acción básica.",
      required: true
    },
    {
      name: "Cookies funcionales",
      desc: "Ayudan a activar o mejorar funciones concretas de la web, como chats, vídeos, formularios o avisos ya cerrados.",
      required: false
    },
    {
      name: "Cookies de preferencias o personalización",
      desc: "Recuerdan elecciones del usuario, como el idioma, la región o la forma en que se muestra una página.",
      required: false
    },
    {
      name: "Cookies analíticas o estadísticas",
      desc: "Recogen información sobre el uso de la web, como páginas visitadas o tiempo de navegación.",
      required: false
    },
    {
      name: "Cookies de marketing o publicidad",
      desc: "Se utilizan para mostrar anuncios personalizados o medir la eficacia de campañas publicitarias.",
      required: false
    },
    {
      name: "Cookies de terceros o proveedores externos",
      desc: "Son gestionadas por empresas externas a la web, normalmente para análisis, publicidad, redes sociales u otros servicios integrados.",
      required: false
    }
  ];

  function switchMarkup(required, checkedByDefault = false) {
    return `
      <label class="switch">
        <input type="checkbox" ${required || checkedByDefault ? "checked" : ""} ${required ? "disabled" : ""}>
        <span class="slider" aria-hidden="true"></span>
      </label>
    `;
  }

  if (variant === "A") {
    settingsTitle.textContent = "CONFIGURAR PREFERENCIAS";
    settingsText.textContent =
      "Puedes personalizar el uso de cookies según tus preferencias. Algunas cookies nos ayudan a ofrecer una experiencia más completa y adaptada.";

    settingsList.className = "category-list category-list-A";

    settingsList.innerHTML = categoriesA.map((cat) => `
  <details class="category-accordion">
    <summary>
      <span>${cat.name}</span>
      ${switchMarkup(cat.required, true)}
    </summary>

    <p>${cat.desc}</p>
  </details>
`).join("");

settingsList.querySelectorAll(".category-accordion summary .switch").forEach((switchEl) => {
  switchEl.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

    const acceptAll = makeBtn("ACEPTAR TODO", "save_accept", true);
    const save = makeBtn("GUARDAR PREFERENCIAS", "save", false);
    const necessaryOnly = makeBtn("usar solo necesarias", "reject_all", false);

    necessaryOnly.classList.add("link", "small-link");

    settingsActions.appendChild(acceptAll);
    settingsActions.appendChild(save);
    settingsActions.appendChild(necessaryOnly);
  } else {
    settingsTitle.textContent = "CONFIGURAR COOKIES";
    settingsText.textContent =
      "Puedes elegir qué cookies opcionales permites. Las necesarias siguen activas para que la web funcione. El resto solo se usará si lo activas.";

    settingsList.className = "category-list category-list-B";

    settingsList.innerHTML = categoriesB.map((cat) => `
      <article class="category-card">
        <div class="category-card-head">
          <div class="category-info">
            <h3>${cat.name}</h3>
            <span class="category-meta">
              ${cat.required ? "Necesaria · Siempre activa" : "Opcional · Desactivada"}
            </span>
          </div>

          ${switchMarkup(cat.required, false)}
        </div>

        <p>${cat.desc}</p>
      </article>
    `).join("");

    settingsList.querySelectorAll(".category-card").forEach((card) => {
      const input = card.querySelector("input[type='checkbox']:not(:disabled)");
      const meta = card.querySelector(".category-meta");

      if (input && meta) {
        input.addEventListener("change", () => {
          meta.textContent = input.checked
            ? "Opcional · Activada"
            : "Opcional · Desactivada";
        });
      }
    });

    settingsActions.appendChild(makeBtn("RECHAZAR OPCIONALES", "reject_all", false));
    settingsActions.appendChild(makeBtn("GUARDAR CONFIGURACIÓN", "save", false));
    settingsActions.appendChild(makeBtn("ACEPTAR OPCIONALES", "save_accept", false));
  }
}

/* ==========================
   BOTONES
========================== */

function makeBtn(label, action, primary) {
  const b = document.createElement("button");

  b.className = primary ? "btn primary" : "btn";
  b.type = "button";
  b.textContent = label;

  b.addEventListener("click", () => {
    handleAction(action, label);
  });

  return b;
}

/* ==========================
   ACCIONES MEDIDAS
========================== */

function handleAction(action, buttonLabel = "") {
  if (action === "config") {
    logEvent("config_open", {
      button_label: buttonLabel || "configurar",
      layer: "first_layer"
    });

    trackGA("cookie_config_open", {
      button_label: buttonLabel || "configurar",
      layer: "first_layer"
    });

    openSettings();
    return;
  }

  if (action === "accept") {
    logEvent("accept", {
      button_label: buttonLabel || "ACEPTAR",
      layer: "first_layer"
    });

    trackGA("cookie_accept", {
      button_label: buttonLabel || "ACEPTAR",
      layer: "first_layer"
    });

    closeAll();
    return;
  }

  if (action === "reject") {
    logEvent("reject", {
      button_label: buttonLabel || "RECHAZAR",
      layer: "first_layer"
    });

    trackGA("cookie_reject", {
      button_label: buttonLabel || "RECHAZAR",
      layer: "first_layer"
    });

    closeAll();
    return;
  }

  if (action === "save") {
    logEvent("save", {
      button_label: buttonLabel || "GUARDAR CONFIGURACIÓN",
      layer: "settings_layer"
    });

    trackGA("cookie_config_save", {
      button_label: buttonLabel || "GUARDAR CONFIGURACIÓN",
      layer: "settings_layer"
    });

    closeAll();
    return;
  }

  if (action === "save_accept") {
    logEvent("save_accept", {
      button_label: buttonLabel || "ACEPTAR OPCIONALES",
      layer: "settings_layer"
    });

    trackGA("cookie_accept_from_settings", {
      button_label: buttonLabel || "ACEPTAR OPCIONALES",
      layer: "settings_layer"
    });

    closeAll();
    return;
  }

  if (action === "reject_all") {
    logEvent("reject_all", {
      button_label: buttonLabel || "RECHAZAR OPCIONALES",
      layer: "settings_layer"
    });

    trackGA("cookie_reject_from_settings", {
      button_label: buttonLabel || "RECHAZAR OPCIONALES",
      layer: "settings_layer"
    });

    closeAll();
    return;
  }

  logEvent(action, {
    button_label: buttonLabel,
    layer: "unknown"
  });

  closeAll();
}

/* ==========================
   INICIO
========================== */

setTimeout(openBanner, 3000);