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
const supaUrlInput = document.getElementById("sb-url");
const supaAnonInput = document.getElementById("sb-anon");
const summarySupaUrl = document.getElementById("summary-sb-url");
const summarySupaAnon = document.getElementById("summary-sb-anon");
const depNode = document.getElementById("dep-node");
const depGit = document.getElementById("dep-git");
const depSupabase = document.getElementById("dep-supabase");
const depWinget = document.getElementById("dep-winget");
const depStatus = document.getElementById("dep-status");
const commitModal = document.getElementById("commit-modal");
const commitCd = document.getElementById("commit-cd");

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

const maskValue = (value) => {
  if (!value) return "(pendiente)";
  const text = String(value);
  if (text.length <= 10) return text;
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
};

const setSupabaseSummary = (url, anon) => {
  if (summarySupaUrl) summarySupaUrl.textContent = url ? url : "(pendiente)";
  if (summarySupaAnon) summarySupaAnon.textContent = maskValue(anon);
};

const setDepStatus = (element, ok) => {
  if (!element) return;
  element.textContent = ok ? "OK" : "Falta";
  element.style.color = ok ? "#9fe870" : "#f78da7";
};

const refreshDeps = async () => {
  const api = getInstaller();
  if (!api?.checkDeps) return;
  const result = await api.checkDeps();
  if (!result.ok) return;
  setDepStatus(depNode, result.node);
  setDepStatus(depGit, result.git);
  setDepStatus(depSupabase, result.supabase);
  setDepStatus(depWinget, result.winget);
};

const installDep = async (name, label) => {
  const api = getInstaller();
  if (!api?.installDep) return;
  setStatus(depStatus, `Instalando ${label}...`, true);
  const result = await api.installDep(name);
  if (result.ok) {
    setStatus(depStatus, `${label} instalado.`, true);
    await refreshDeps();
  } else {
    setStatus(depStatus, result.error || `Error instalando ${label}`, false);
  }
};

const toggleCommitModal = (show) => {
  if (!commitModal) return;
  commitModal.classList.toggle("show", show);
  commitModal.setAttribute("aria-hidden", show ? "false" : "true");
};

const fillCommitPath = async () => {
  const api = getInstaller();
  if (!api?.getProjectPath || !commitCd) return;
  const result = await api.getProjectPath();
  if (!result.ok || !result.path) return;
  commitCd.textContent = `cd "${result.path}"`;
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

  if (action === "open-commit-modal") {
    await fillCommitPath();
    toggleCommitModal(true);
    return;
  }

  if (action === "close-commit-modal") {
    toggleCommitModal(false);
    return;
  }

  if (action === "check-deps") {
    await refreshDeps();
    setStatus(depStatus, "Revision completada.", true);
    return;
  }

  if (action === "install-node") {
    await installDep("node", "Node.js");
    return;
  }

  if (action === "install-git") {
    await installDep("git", "Git");
    return;
  }

  if (action === "install-supabase") {
    await installDep("supabase", "Supabase CLI");
    return;
  }

  if (action === "install-all") {
    await installDep("node", "Node.js");
    await installDep("git", "Git");
    await installDep("supabase", "Supabase CLI");
    return;
  }

  if (action === "open-node") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://nodejs.org/en/download");
    return;
  }

  if (action === "open-git") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://git-scm.com/downloads");
    return;
  }

  if (action === "open-supabase") {
    const api = getInstaller();
    if (!api?.openUrl) return;
    await api.openUrl("https://supabase.com/docs/guides/cli/getting-started");
    return;
  }

  if (action === "help-403") {
    await openInfo(
      "Error 403 significa que Git esta usando otra cuenta.\n\n" +
        "Solucion rapida:\n" +
        "1) Abre Panel de control > Administrador de credenciales.\n" +
        "2) En Credenciales de Windows, elimina las de github.com.\n" +
        "3) Vuelve a intentar el push y pega el token correcto."
    );
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
      setTimeout(() => goTo(8), 800);
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
  refreshDeps();
  fillCommitPath();
  const savedBusiness = loadValue("businessName");
  if (businessNameInput) businessNameInput.value = savedBusiness;
  setBusinessName(savedBusiness);

  const savedOwner = loadValue("gitOwner");
  const savedRepo = loadValue("gitRepo");
  if (gitOwnerInput) gitOwnerInput.value = savedOwner;
  if (gitRepoInput) gitRepoInput.value = savedRepo;

  const savedSupaUrl = loadValue("supaUrl");
  const savedSupaAnon = loadValue("supaAnon");
  if (supaUrlInput) supaUrlInput.value = savedSupaUrl;
  if (supaAnonInput) supaAnonInput.value = savedSupaAnon;
  setSupabaseSummary(savedSupaUrl, savedSupaAnon);

  loadSqlInto("schema_public.sql", "sb-schema", schemaStatusEl, "schema_public.sql");
  loadSqlInto("rls_policies.sql", "sb-rls", rlsStatusEl, "rls_policies.sql");
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  toggleCommitModal(false);
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

  if (target.id === "sb-url") {
    saveValue("supaUrl", target.value);
    setSupabaseSummary(target.value, supaAnonInput ? supaAnonInput.value : "");
  }

  if (target.id === "sb-anon") {
    saveValue("supaAnon", target.value);
    setSupabaseSummary(supaUrlInput ? supaUrlInput.value : "", target.value);
  }
});
