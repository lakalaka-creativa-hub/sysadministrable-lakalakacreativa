const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("installer", {
  writeEnv: (data) => ipcRenderer.invoke("write-env", data),
  runSchema: (data) => ipcRenderer.invoke("run-schema", data),
  openUrl: (url) => ipcRenderer.invoke("open-url", url),
  pickSchema: () => ipcRenderer.invoke("pick-schema"),
  readSql: (fileName) => ipcRenderer.invoke("read-sql", fileName),
  showInfo: (message) => ipcRenderer.invoke("show-info", message),
  gitPush: (data) => ipcRenderer.invoke("git-push", data),
  gitClean: () => ipcRenderer.invoke("git-clean"),
  checkDeps: () => ipcRenderer.invoke("check-deps"),
  installDep: (name) => ipcRenderer.invoke("install-dep", name),
  getProjectPath: () => ipcRenderer.invoke("get-project-path"),
});
