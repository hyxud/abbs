const { invoke } = window.__TAURI__.tauri;
const { createDir, BaseDirectory, exists } = window.__TAURI__.fs;
const { homeDir, join, resourceDir } = window.__TAURI__.path;

let logDiv;
let scroll = true;
let homePath;
let pdfPath;
let imgPath;
let jsonPath;
let pdfPathInput;
let imgPathInput;
let jsonPathInput;
let resPath;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function updateScroll() {
    if (scroll) {
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}
function err(string) {
    logDiv.innerHTML =
        logDiv.innerHTML + "<p class='red'>[Error] " + string.toString().replaceAll("\n", "<br>") + "</p>";
    updateScroll();
}
function suc(string) {
    logDiv.innerHTML =
        logDiv.innerHTML + "<p class='green'>=> " + string.toString().replaceAll("\n", "<br>") + "</p>";
    updateScroll();
}
function info(string) {
    logDiv.innerHTML =
        logDiv.innerHTML + "<p class='blue'>[Info] " + string.toString().replaceAll("\n", "<br>") + "</p>";
    updateScroll();
}
function log(string) {
    logDiv.innerHTML = logDiv.innerHTML + "<p class='white'>" + string.toString().replaceAll("\n", "<br>") + "</p>";
    updateScroll();
}

function start() {}
function kill() {
    inf("Killed");
}
async function initApp() {
    logDiv = document.getElementById("log");
    document.getElementById("start").addEventListener("click", start);
    document.getElementById("stop").addEventListener("click", kill);

    pdfPathInput = document.getElementById("pdf");
    imgPathInput = document.getElementById("img");
    jsonPathInput = document.getElementById("json");

    homePath = await homeDir();
    resPath = await resourceDir();

    document.getElementById("pdf-p").innerHTML = homePath;
    document.getElementById("img-p").innerHTML = homePath;
    document.getElementById("json-p").innerHTML = homePath;

    pdfPath = homePath;
    imgPath = homePath;
    jsonPath = homePath;

    pdfPathInput.addEventListener("change", async (e) => {
        pdfPath = await join(homePath, e.target.value);
    });
    imgPathInput.addEventListener("change", async (e) => {
        imgPath = await join(homePath, e.target.value);
    });
    jsonPathInput.addEventListener("change", async (e) => {
        jsonPath = await join(homePath, e.target.value);
    });
    if (await exists(await join(resPath, "config.json"))) {
        suc("found config.json");
    } else {
        err("config.json not found");
    }
    

    document.getElementById("autoscroll").addEventListener("change", (e) => {
        scroll = e.target.checked;
    });
}

window.addEventListener("DOMContentLoaded", initApp);
