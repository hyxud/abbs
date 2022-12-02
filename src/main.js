const { invoke } = window.__TAURI__.tauri;
const { createDir, removeDir, readDir, removeFile, BaseDirectory, exists, readTextFile, writeFile } = window.__TAURI__.fs;
const { homeDir, join, resourceDir } = window.__TAURI__.path;
const { Command } = window.__TAURI__.shell;
let logDiv;
let scroll = true;
let homePath;


let pdfPathInput;
let imgPathInput;
let jsonPathInput;
let resPath;
let list
let on = false;

let config = {
    reload: false,
    pdfPath: "pdf",
    imgPath: "images",
    jsonPath: "output",
    page: 1,
    index: 0,
    local: true,
    repitition: false
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

function kill() {
    warn("Stopping Bot. please wait until bot is safely stopped.")
    on = false
}
function getUsedDir() {
    return config.local ? resPath : homePath
}
function usedDir() {
    return config.local ? BaseDirectory.Resource : BaseDirectory.Home
}


function updateGui() {
    document.getElementById("pdf-p").innerHTML = getUsedDir();
    document.getElementById("img-p").innerHTML = getUsedDir();
    document.getElementById("json-p").innerHTML = getUsedDir();
    document.getElementById("local").checked = config.local
    document.getElementById("rep").checked = config.repitition
    document.getElementById("reload").checked = config.reload
    document.getElementById("index").value = config.index;
    document.getElementById("page").value = config.page
    document.getElementById("index").disabled = on;
    document.getElementById("page").disabled = on
    document.getElementById("start").classList.toggle("running", on)
    document.getElementById("start").disabled = on

    jsonPathInput.value = config.jsonPath
    pdfPathInput.value = config.pdfPath
    imgPathInput.value = config.imgPath
}

async function updateConfig() {
    await writeFile(".abbs/config.json", JSON.stringify(config), {dir: BaseDirectory.Home})
}

async function check() {
    logDiv.innerHTML = ""

    if (await exists(await join(homePath, ".abbs", "config.json"))) {
        suc("found config.json");
        config = JSON.parse(await readTextFile(".abbs/config.json", {dir: BaseDirectory.Home}))

        
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


    document.getElementById("start").addEventListener("click", ()=>{
        if (!on) {
            on = true
            start()
            updateGui()
        }
    });
    document.getElementById("stop").addEventListener("click", ()=>{
        if (on) {
            kill()
            updateGui()
        }
    });
    document.getElementById("check").addEventListener("click", check);
    document.getElementById("clearLog").addEventListener("click", ()=>{logDiv.innerHTML = ""});


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

    document.getElementById("index").addEventListener("change", (e) => {
        config.index = parseInt(e.target.value);
        updateConfig()
        updateGui()
    });
    document.getElementById("page").addEventListener("change", (e) => {
        config.page = parseInt(e.target.value);
        
        updateConfig()
        updateGui()
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
        config.repitition = e.target.checked ? true : false
        updateConfig()
        updateGui()
    });
    document.getElementById("reload").addEventListener("change", (e) => {
        config.reload = e.target.checked ? true : false
        updateConfig()
        updateGui()
    });


}




async function start() {
    updateGui()
    try {
        if (!on) {
            suc("the bot has been safely Stopped")
            return
        }
        log("requesting data...");
        let html;
        let cmd = (config.page == 1) ? `https://www.arab-books.com/` : `https://www.arab-books.com/page/${config.page}/`
        const out = await new Command('curl', cmd).execute()
        html = out.stdout
        console.log(out);
        let doc = document.createElement("div")
        doc.innerHTML = html
    
        list = doc.querySelectorAll(".book-card");
        if (!on) {
            suc("the bot has been safely Stopped")
            return
        }
        log(config.index)
        for (let index = config.index; index < list.length; index++) {
            let book = list[index];
            let exists = false;
            let url = book.querySelector(".post-title").children[0].href;
            for (let i = 0; i < json.length; i++) {
                let cmpBook = json[i];
                let title = book.querySelector(".post-title").children[0].innerHTML.replace("PDF", "").replace("pdf", "");
                if (cmpBook["title"] == title) {
                    warn(
                        "Book Already Exists in index: " +
                            i +
                            " of books.json, skipping"
                    );
                    exists = true;
                    break;
                }
            }
    
            if (config.repitition && exists) {
                warn("Book already Exists but repitition is ON, adding book...")
                continue;
            }
    
    
            config["index"] = index;
            suc(`${index + 1} / ${list.length} - page: ${config["page"]}`);
            updateConfig()
            updateGui()
            if (!on) {
                config.index = index + 1
                suc("the bot has been safely Stopped")
                updateConfig()
                updateGui()
                return
            }
        }
        info("Finished page " + config["page"] + ". starting next Page...");
        log("waiting 5 seconds...");
        config["page"]++;
        config["index"] = 0;
        updateConfig()
        updateGui()
        if (!on) {
            suc("the bot has been safely Stopped")
            return
        }
        await sleep(5000);
        start();
    } catch (error) {
        err("The bot has crashed, error will be logged to the developer console")
        console.log(error);
        on = false
    }
}



window.addEventListener("DOMContentLoaded", initApp);
