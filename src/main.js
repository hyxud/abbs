const { invoke } = window.__TAURI__.tauri;
const { createDir, removeDir, readDir, removeFile, BaseDirectory, exists, readTextFile, writeFile } = window.__TAURI__.fs;
const { homeDir, join, resourceDir } = window.__TAURI__.path;
let logDiv;
let scroll = true;
let homePath;

let index
let page

let pdfPathInput;
let imgPathInput;
let jsonPathInput;
let resPath;

let config = {
    reload: false,
    pdfPath: "pdf",
    imgPath: "images",
    jsonPath: "output",
    page: 1,
    index: 0,
    local: true,
    repition: false
};

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
function warn(string) {
    logDiv.innerHTML = logDiv.innerHTML + "<p class='yellow'>[Warning] " + string.toString().replaceAll("\n", "<br>") + "</p>";
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
function getUsedDir() {
    return config.local ? resPath : homePath
}
function usedDir() {
    return config.local ? BaseDirectory.Resource : BaseDirectory.Home
}

async function init() {
    if (!existsSync(join(__dirname, "books.json"))) {
        writeFileSync(join(__dirname, "books.json"), "[]");
    }

    config["index"] = 0;

    if (!config["reload"]) {
        config = JSON.parse(readFileSync(join(__dirname, "config.json")));
        let jsonData = JSON.parse(readFileSync(join(__dirname, "books.json")));
        json = JSON.parse(JSON.stringify(jsonData));
        imgIndex = 0;
        pdfIndex = 0;
        if (!jsonData.length == 0) {
            imgIndex = json[jsonData.length - 1].img + 1;
            pdfIndex = json[jsonData.length - 1].pdf + 1;
        }
    }
    checkdir(config["imagePath"]);
    checkdir(config["pdfPath"]);

    main();
}
async function reset() {
    
}

function updateGui() {
    document.getElementById("pdf-p").innerHTML = getUsedDir();
    document.getElementById("img-p").innerHTML = getUsedDir();
    document.getElementById("json-p").innerHTML = getUsedDir();
    document.getElementById("local").checked = config.local
    document.getElementById("rep").checked = config.repition
    document.getElementById("reload").checked = config.reload

    jsonPathInput.value = config.jsonPath
    pdfPathInput.value = config.pdfPath
    imgPathInput.value = config.imgPath
}

async function updateConfig() {
    await writeFile(".abbs/config.json", JSON.stringify(config), {dir: BaseDirectory.Home})
}

async function check() {
    logDiv.innerHTML = ""

    index = 0
    page = 1

    if (await exists(await join(homePath, ".abbs", "config.json"))) {
        suc("found config.json");
        config = JSON.parse(await readTextFile(".abbs/config.json", {dir: BaseDirectory.Home}))
        index = config.index
        page = config.page
        updateGui()
    } else {
        err("config.json not found");
        info("creating .abbs directory")
        await createDir(".abbs", {dir: BaseDirectory.Home, recursive: true});
        info("creating config.json")
        await writeFile(".abbs/config.json", JSON.stringify(config), {dir: BaseDirectory.Home})
        warn("restarting...")
        await sleep(1000)
        check()
        return
    }

    if (config.reload) {
        warn("Reload is ON, All Previously saved data will be deleted")
    }    
        
    if (await exists(await join(getUsedDir(),config.jsonPath, "books.json"))) {
        suc("found books.json");
        if (config.reload) {
            await writeFile(await join(config.jsonPath, "books.json"), "[]", {dir: usedDir()})
        }
    } else {
        err("books.json not found");
        info("creating books.json in " + await join(getUsedDir(), config.jsonPath))
        await createDir(config.jsonPath, {dir: usedDir(), recursive: true})
        await writeFile(await join(config.jsonPath, "books.json"), "[]", {dir: usedDir()})
        suc("created books.json")
    }


    if (await exists(await join(getUsedDir(),config.imgPath))) {
        suc("found images directory");
        if (config.reload) {
            let files = await readDir(config.imgPath, {dir: usedDir(), recursive: true})
            files.forEach(async file => {
                if (file.children == null) {
                    await removeFile(await join(config.imgPath, file.name), {dir: usedDir()})
                }else {
                    await removeDir(await join(config.imgPath, file.name), {dir: usedDir(), recursive: true})

                }
            });
        }
    } else {
        err("images directory not found");
        info("creating images folder in " + await join(getUsedDir(), config.imgPath))
        await createDir(config.imgPath, {dir: usedDir(), recursive: true})
        suc("created images folder")
    }


    if (await exists(await join(getUsedDir(),config.pdfPath))) {
        suc("found pdf directory");
        if (config.reload) {
            let files = await readDir(config.pdfPath, {dir: usedDir(), recursive: true})
            files.forEach(async file => {
                if (file.children == null) {
                    await removeFile(await join(config.pdfPath, file.name), {dir: usedDir()})
                }else {
                    await removeDir(await join(config.pdfPath, file.name), {dir: usedDir(), recursive: true})

                }
            });
        }
    } else {
        err("pdf directory not found");
        info("creating pdf folder in " + await join(getUsedDir(), config.pdfPath))
        await createDir(config.pdfPath, {dir: usedDir(), recursive: true})
        suc("created pdf folder")
    }

}

async function initApp() {
    homePath = await homeDir();
    resPath = await resourceDir();
    logDiv = document.getElementById("log");
    check()


    document.getElementById("start").addEventListener("click", start);
    document.getElementById("stop").addEventListener("click", kill);
    document.getElementById("check").addEventListener("click", check);


    pdfPathInput = document.getElementById("pdf");
    imgPathInput = document.getElementById("img");
    jsonPathInput = document.getElementById("json");

    
    
    
    updateGui()
    pdfPathInput.addEventListener("change",  (e) => {
        config.pdfPath = e.target.value
        updateConfig()
    });
    imgPathInput.addEventListener("change", (e) => {
        config.imgPath = e.target.value;
        updateConfig()
    });
    jsonPathInput.addEventListener("change", (e) => {
        config.jsonPath = e.target.value;
        updateConfig()
    });
    

    document.getElementById("autoscroll").addEventListener("change", (e) => {
        scroll = e.target.checked;
    });
    document.getElementById("local").addEventListener("change", (e) => {
        config.local = e.target.checked ? true : false
        updateConfig()
        updateGui()
    });
    document.getElementById("rep").addEventListener("change", (e) => {
        config.repition = e.target.checked ? true : false
        updateConfig()
        updateGui()
    });
    document.getElementById("reload").addEventListener("change", (e) => {
        config.reload = e.target.checked ? true : false
        updateConfig()
        updateGui()
    });


}

window.addEventListener("DOMContentLoaded", initApp);
