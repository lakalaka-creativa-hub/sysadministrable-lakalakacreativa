const steps = Array.from(document.querySelectorAll(".step"));
const screens = Array.from(document.querySelectorAll(".screen"));
const statusEl = document.getElementById("save-status");
const schemaStatusEl = document.getElementById("schema-status");
const rlsStatusEl = document.getElementById("rls-status");
const gitStatusEl = document.getElementById("git-status");
const businessNameInput = document.getElementById("business-name");
const businessNameTargets = Array.from(document.querySelectorAll("[data-business='name']"));
const gitOwnerInput = document.getElementById("git-owner");
const gitRepoInput = document.getElementById("git-repo");

const maxStep = steps.length;

const goTo = (index) => {
  steps.forEach((step) => step.classList.toggle("active", step.dataset.step === String(index)));
  screens.forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === String(index)));
  if (statusEl) statusEl.textContent = "";
  if (schemaStatusEl) schemaStatusEl.textContent = "";
  if (rlsStatusEl) rlsStatusEl.textContent = "";
  if (gitStatusEl) gitStatusEl.textContent = "";
};

const getInstaller = () => {
  if (window.installer) return window.installer;
  alert("El instalador no esta disponible. Reinicia la app.");
  return null;
};

const openInfo = async (message) => {
  const api = getInstaller();
  if (!api?.showInfo) {
    alert(message);
    return;
  }
  await api.showInfo(message);
};

const setStatus = (element, message, ok = true) => {
  if (!element) return;
  element.textContent = message;
  element.style.color = ok ? "#9fe870" : "#f78da7";
};

const setBusinessName = (value) => {
  const name = value && value.trim() ? value.trim() : "este negocio";
  businessNameTargets.forEach((el) => {
    el.textContent = name;
  });
};

const saveValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (_err) {
    // Ignore storage errors
  }
};

const loadValue = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch (_err) {
    return "";
  }
};

const resetForm = () => {
  if (businessNameInput) businessNameInput.value = "";
  if (gitOwnerInput) gitOwnerInput.value = "";
  if (gitRepoInput) gitRepoInput.value = "";
  const gitTokenInput = document.getElementById("git-token");
  if (gitTokenInput) gitTokenInput.value = "";
  const supaUrl = document.getElementById("sb-url");
  const supaAnon = document.getElementById("sb-anon");
  const supaService = document.getElementById("sb-service");
  if (supaUrl) supaUrl.value = "";
  if (supaAnon) supaAnon.value = "";
  if (supaService) supaService.value = "";
  setBusinessName("");
};

const copyText = async (text, statusEl, label) => {
  if (!text) {
    statusEl.textContent = `No hay SQL para ${label}.`;
    statusEl.style.color = "#f78da7";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = `SQL copiado: ${label}.`;
    statusEl.style.color = "#9fe870";
  } catch (err) {
    statusEl.textContent = "No se pudo copiar. Intenta seleccionar y copiar manual.";
    statusEl.style.color = "#f78da7";
  }
};

const loadSqlInto = async (fileName, targetId, statusEl, label) => {
  const api = getInstaller();
  if (!api?.readSql) return;
  const result = await api.readSql(fileName);
  if (result.ok) {
    const target = document.getElementById(targetId);
    if (target) target.value = result.content || "";
    statusEl.textContent = `SQL cargado: ${label}.`;
    statusEl.style.color = "#9fe870";
  } else {
    statusEl.textContent = result.error || `No se pudo cargar ${label}.`;
    statusEl.style.color = "#f78da7";
  }
};

const handleAction = async (action) => {
  if (action === "next") {
    const current = screens.find((s) => s.classList.contains("active"));
    const currentIndex = Number(current?.dataset.screen || 1);
    goTo(Math.min(currentIndex + 1, maxStep));
    return;
  }

  if (action === "prev") {
    const current = screens.find((s) => s.classList.contains("active"));
    const currentIndex = Number(current?.dataset.screen || 1);
    goTo(Math.max(currentIndex - 1, 1));
    return;
  }

  if (action === "email-no") {
    await openInfo("Crea un correo nuevo para el negocio. Luego regresa y continua.");
    return;
  }

  if (action === "sb-no") {
    await openInfo("Crea el proyecto en Supabase. Luego regresa y continua.");
    return;
  }

  if (action === "open-conn") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://supabase.com/dashboard/project/_/settings/database");
    return;
  }

  if (action === "open-sql") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://supabase.com/dashboard/project/_/sql");
    return;
  }

  if (action === "open-keys") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://supabase.com/dashboard/project/_/settings/api");
    return;
  }

  if (action === "open-vercel") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://vercel.com/new");
    return;
  }

  if (action === "open-github-new") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://github.com/new");
    return;
  }

  if (action === "open-github-token") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://github.com/settings/tokens/new");
    return;
  }

  if (action === "reset") {
    const confirmReset = window.confirm("Esto limpiara los campos del instalador. Quieres continuar?");
    if (!confirmReset) return;
    try {
      localStorage.removeItem("businessName");
      localStorage.removeItem("gitOwner");
      localStorage.removeItem("gitRepo");
    } catch (_err) {
      // Ignore storage errors
    }
    resetForm();
    setStatus(gitStatusEl, "Datos reiniciados.");
    goTo(1);
    return;
  }

  if (action === "save") {
    const url = document.getElementById("sb-url").value.trim();
    const anonKey = document.getElementById("sb-anon").value.trim();
    const serviceKey = document.getElementById("sb-service").value.trim();

    if (!url || !anonKey || !serviceKey) {
      setStatus(statusEl, "Completa todos los campos.", false);
      return;
    }

    const result = await window.installer.writeEnv({ url, anonKey, serviceKey });
    if (result.ok) {
      setStatus(statusEl, "Listo. .env.local guardado en el proyecto.");
      setTimeout(() => goTo(7), 800);
    } else {
      setStatus(statusEl, result.error || "Error guardando .env.local", false);
    }
    return;
  }

  if (action === "git-push") {
    const owner = document.getElementById("git-owner").value.trim();
    const repo = document.getElementById("git-repo").value.trim();
    const token = document.getElementById("git-token").value.trim();

    if (!owner || !repo || !token) {
      setStatus(gitStatusEl, "Completa usuario, repo y token.", false);
      return;
    }

    setStatus(gitStatusEl, "Subiendo a GitHub...", true);
    const result = await window.installer.gitPush({ owner, repo, token });
    if (result.ok) {
      setStatus(gitStatusEl, "Listo. Proyecto subido a GitHub.", true);
    } else {
      setStatus(
        gitStatusEl,
        result.error || "Error subiendo a GitHub. Usa 'Limpiar Git y reintentar'.",
        false
      );
    }
    return;
  }

  if (action === "git-clean") {
    const confirmReset = window.confirm(
      "Esto va a borrar el historial de Git local para evitar archivos grandes. Quieres continuar?"
    );
    if (!confirmReset) return;
    const result = await window.installer.gitClean();
    if (result.ok) {
      setStatus(gitStatusEl, "Git limpio. Ahora puedes volver a subir.", true);
    } else {
      setStatus(gitStatusEl, result.error || "No se pudo limpiar Git", false);
    }
    return;
  }

  if (action === "load-schema") {
    await loadSqlInto("schema_public.sql", "sb-schema", schemaStatusEl, "schema_public.sql");
    return;
  }

  if (action === "load-rls") {
    await loadSqlInto("rls_policies.sql", "sb-rls", rlsStatusEl, "rls_policies.sql");
    return;
  }

  if (action === "copy-schema") {
    await copyText(document.getElementById("sb-schema").value, schemaStatusEl, "schema_public.sql");
    return;
  }

  if (action === "copy-rls") {
    await copyText(document.getElementById("sb-rls").value, rlsStatusEl, "rls_policies.sql");
    return;
  }

  if (action === "exit") {
    window.close();
  }
};

window.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  if (!action) return;
  handleAction(action);
});

window.addEventListener("DOMContentLoaded", () => {
  goTo(1);
  const savedBusiness = loadValue("businessName");
  if (businessNameInput) businessNameInput.value = savedBusiness;
  setBusinessName(savedBusiness);

  const savedOwner = loadValue("gitOwner");
  const savedRepo = loadValue("gitRepo");
  if (gitOwnerInput) gitOwnerInput.value = savedOwner;
  if (gitRepoInput) gitRepoInput.value = savedRepo;

  loadSqlInto("schema_public.sql", "sb-schema", schemaStatusEl, "schema_public.sql");
  loadSqlInto("rls_policies.sql", "sb-rls", rlsStatusEl, "rls_policies.sql");
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.id === "business-name") {
    const value = target.value;
    setBusinessName(value);
    saveValue("businessName", value);
  }

  if (target.id === "git-owner") {
    saveValue("gitOwner", target.value);
  }

  if (target.id === "git-repo") {
    saveValue("gitRepo", target.value);
  }
});
