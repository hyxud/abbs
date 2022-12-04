const { invoke } = window.__TAURI__.tauri;
const {
    createDir,
    removeDir,
    readDir,
    removeFile,
    BaseDirectory,
    exists,
    readTextFile,
    writeFile,
} = window.__TAURI__.fs;
const { homeDir, join } = window.__TAURI__.path;
const { Command } = window.__TAURI__.shell;
let logDiv;
let scroll = true;
let homePath;
let pdfPathInput;
let imgPathInput;
let jsonPathInput;
let resPath;
let list;
let on = false;
let running = false;
let json = [];

let config = {
    reset: false,
    pdfPath: "duplycato/output/pdf",
    imgPath: "duplycato/output/images",
    jsonPath: "duplycato/output",
    page: 1,
    index: 0,
    local: true,
    repitition: false,
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function makeid(length) {
    var result = "";
    var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}
function updateScroll() {
    if (scroll) {
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}
function err(string) {
    logDiv.innerHTML =
        logDiv.innerHTML +
        "<p class='red'>[Error] " +
        string.toString().replaceAll("\n", "<br>") +
        "</p>";
    updateScroll();
}
function suc(string) {
    logDiv.innerHTML =
        logDiv.innerHTML +
        "<p class='green'>=> " +
        string.toString().replaceAll("\n", "<br>") +
        "</p>";
    updateScroll();
}
function info(string) {
    logDiv.innerHTML =
        logDiv.innerHTML +
        "<p class='blue'>[Info] " +
        string.toString().replaceAll("\n", "<br>") +
        "</p>";
    updateScroll();
}
function warn(string) {
    logDiv.innerHTML =
        logDiv.innerHTML +
        "<p class='yellow'>[Warning] " +
        string.toString().replaceAll("\n", "<br>") +
        "</p>";
    updateScroll();
}
function log(string) {
    logDiv.innerHTML =
        logDiv.innerHTML +
        "<p class='white'>" +
        string.toString().replaceAll("\n", "<br>") +
        "</p>";
    updateScroll();
}

function kill() {
    warn("Stopping Bot. please wait until bot is safely stopped.");
    on = false;
}
function getUsedDir() {
    return config.local ? resPath : homePath;
}
function usedDir() {
    return config.local ? BaseDirectory.Home : BaseDirectory.Home;
}
function onStop() {
    if (config.reset) {
        check();
    }
}

function updateGui() {
    document.getElementById("pdf-p").innerHTML = getUsedDir();
    document.getElementById("img-p").innerHTML = getUsedDir();
    document.getElementById("json-p").innerHTML = getUsedDir();
    // document.getElementById("local").checked = config.local;
    document.getElementById("rep").checked = config.repitition;
    document.getElementById("reset-check").checked = config.reset;
    document.getElementById("index").value = config.index;
    document.getElementById("page").value = config.page;
    document.getElementById("index").disabled = running;
    document.getElementById("page").disabled = running;
    document.getElementById("start").classList.toggle("running", running);
    document.getElementById("start").disabled = running;

    jsonPathInput.value = config.jsonPath;
    pdfPathInput.value = config.pdfPath;
    imgPathInput.value = config.imgPath;
}

async function updateConfig() {
    await writeFile(".duplycato/config.json", JSON.stringify(config), {
        dir: BaseDirectory.Home,
    });
}

async function check() {
    logDiv.innerHTML = "";

    if (await exists(await join(homePath, ".duplycato", "config.json"))) {
        suc("found config.json");
        config = JSON.parse(
            await readTextFile(".duplycato/config.json", { dir: BaseDirectory.Home })
        );

        updateGui();
    } else {
        err("config.json not found");
        info("creating .duplycato directory");
        await createDir(".duplycato", { dir: BaseDirectory.Home, recursive: true });
        info("creating config.json");
        await writeFile(".duplycato/config.json", JSON.stringify(config), {
            dir: BaseDirectory.Home,
        });
        warn("restarting...");
        await sleep(1000);
        check();
        return;
    }

    if (config.reset) {
        warn("Reset is ON, All Previously saved data will be deleted");
        config.index = 0;
        config.page = 1;
        updateConfig();
        updateGui();
    }

    if (await exists(await join(getUsedDir(), config.jsonPath, "books.json"))) {
        suc("found books.json");
        if (config.reset) {
            await writeFile(await join(config.jsonPath, "books.json"), "[]", {
                dir: usedDir(),
            });
        }
    } else {
        err("books.json not found");
        info(
            "creating books.json in " +
                (await join(getUsedDir(), config.jsonPath))
        );
        await createDir(config.jsonPath, { dir: usedDir(), recursive: true });
        await writeFile(await join(config.jsonPath, "books.json"), "[]", {
            dir: usedDir(),
        });
        suc("created books.json");
    }

    if (await exists(await join(getUsedDir(), config.imgPath))) {
        suc("found images directory");
        if (config.reset) {
            clearImageFolder();
        }
    } else {
        err("images directory not found");
        info(
            "creating images folder in " +
                (await join(getUsedDir(), config.imgPath))
        );
        await createDir(config.imgPath, { dir: usedDir(), recursive: true });
        suc("created images folder");
    }

    if (await exists(await join(getUsedDir(), config.pdfPath))) {
        suc("found pdf directory");
        if (config.reset) {
            clearPdfFolder();
        }
    } else {
        err("pdf directory not found");
        info(
            "creating pdf folder in " +
                (await join(getUsedDir(), config.pdfPath))
        );
        await createDir(config.pdfPath, { dir: usedDir(), recursive: true });
        suc("created pdf folder");
    }
}

async function initApp() {
    homePath = await homeDir();
    resPath = await homeDir();
    logDiv = document.getElementById("log");
    check();

    document.getElementById("start").addEventListener("click", () => {
        if (!running) {
            on = true;
            running = true;
            start();
            updateGui();
        } else {
            warn("Bot already Running")
        }
    });
    document.getElementById("stop").addEventListener("click", () => {
        if (on && running) {
            kill();
            updateGui();
        } else if (!on && running) {
            warn("Already Stopping Bot. please wait to stop data loss risk")
        } else if (!running) {
            warn("Bot not Running")
        } else {
            err("Unknow Case")
        }
    });
    document.getElementById("check").addEventListener("click", check);
    document.getElementById("clearLog").addEventListener("click", () => {
        logDiv.innerHTML = "";
    });

    pdfPathInput = document.getElementById("pdf");
    imgPathInput = document.getElementById("img");
    jsonPathInput = document.getElementById("json");

    updateGui();
    pdfPathInput.addEventListener("change", (e) => {
        config.pdfPath = e.target.value;
        updateConfig();
    });
    imgPathInput.addEventListener("change", (e) => {
        config.imgPath = e.target.value;
        updateConfig();
    });
    jsonPathInput.addEventListener("change", (e) => {
        config.jsonPath = e.target.value;
        updateConfig();
    });

    document.getElementById("index").addEventListener("change", (e) => {
        config.index = parseInt(e.target.value);
        updateConfig();
        updateGui();
    });
    document.getElementById("page").addEventListener("change", (e) => {
        config.page = parseInt(e.target.value);

        updateConfig();
        updateGui();
    });

    document.getElementById("autoscroll").addEventListener("change", (e) => {
        scroll = e.target.checked;
    });
    // document.getElementById("local").addEventListener("change", (e) => {
    //     config.local = e.target.checked ? true : false;
    //     updateConfig();
    //     updateGui();
    // });
    document.getElementById("rep").addEventListener("change", (e) => {
        config.repitition = e.target.checked ? true : false;
        updateConfig();
        updateGui();
    });
    document.getElementById("reset-check").addEventListener("change", (e) => {
        config.reset = e.target.checked ? true : false;
        updateConfig();
        updateGui();
    });
    document.getElementById("reset").addEventListener("click", async () => {
        warn("Clearing Images")
        clearImageFolder()
        warn("Clearing PDFs")
        clearPdfFolder()
        config.index = 0
        config.page = 1
        json = []
        document.getElementById("index").value = config.index;
        document.getElementById("page").value = config.page;
        warn("Clearing Books.json")
        await writeFile(
            await join(config.jsonPath, "books.json"),
            "[]",
            { dir: usedDir() }
        );
        updateGui()
        updateConfig()
    });
}

async function clearPdfFolder() {
    let files = await readDir(config.pdfPath, {
        dir: usedDir(),
        recursive: true,
    });
    files.forEach(async (file) => {
        if (file.children == null) {
            await removeFile(await join(config.pdfPath, file.name), {
                dir: usedDir(),
            });
        } else {
            await removeDir(await join(config.pdfPath, file.name), {
                dir: usedDir(),
                recursive: true,
            });
        }
    });
}
async function clearImageFolder() {
    let files = await readDir(config.imgPath, {
        dir: usedDir(),
        recursive: true,
    });
    files.forEach(async (file) => {
        if (file.children == null) {
            await removeFile(await join(config.imgPath, file.name), {
                dir: usedDir(),
            });
        } else {
            await removeDir(await join(config.imgPath, file.name), {
                dir: usedDir(),
                recursive: true,
            });
        }
    });
}

async function getBook(url) {
    let html;
    let downHtml;
    let out = await new Command("curl", url).execute();
    html = out.stdout;
    let doc = document.createElement("div");
    let obj = {};
    doc.innerHTML = html;

    let title = doc.querySelector(".post-title").innerHTML;
    obj.title = title.replace("PDF", "").replace("pdf", "");

    let entries = doc.querySelector(".book-info").children[0].children;
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        let text = entry.textContent;
        let key = text.split(":")[0].replaceAll("\n", "");
        let value = text.split(":")[1].replaceAll("\n", "");
        obj[key] = value;
    }
    let reqUrl;
    try {
        reqUrl = doc.querySelector(".down-link-bottom").children[0].href;
    } catch {
        err("Failed getting book's Download page. skipping");
        return 1;
    }

    let imageUrl = doc.querySelector(".attachment-jannah-image-post").src;
    out = await new Command("curl", reqUrl).execute();
    downHtml = out.stdout;

    let downloadUrl;
    try {
        downloadUrl = downHtml.split('url="')[1].split('"')[0];
    } catch {
        err("Failed getting book's Download URL. skipping");
        return 1;
    }

    let imgName = makeid(20);
    let pdfName = makeid(20);

    out = await new Command("curlout", [
        imageUrl,
        "--output",
        await join(getUsedDir(), config.imgPath, imgName + ".jpg"),
    ]).execute();
    if (out.code != 0) {
        err("Failed Downloading Book image. skipping.");
        console.log(out);
        return 1;
    }
    out = await new Command("curlout", [
        downloadUrl,
        "--output",
        await join(getUsedDir(), config.pdfPath, pdfName + ".pdf"),
    ]).execute();
    if (out.code != 0) {
        err("Failed Downloading Book PDF. skipping.");
        return 1;
    }
    obj.img = imgName;
    obj.pdf = pdfName;
    
    json.push(obj);
    await writeFile(
        await join(config.jsonPath, "books.json"),
        JSON.stringify(json),
        { dir: usedDir() }
    );
    updateGui();
    return 0;
}

async function start() {
    updateGui();
    try {
        if (!on) {
            running = false;
            updateGui();
            suc("the bot has been safely Stopped");
            onStop();
            return;
        }
        log("requesting data...");
        let html;
        let cmd =
            config.page == 1
                ? `https://www.arab-books.com/`
                : `https://www.arab-books.com/page/${config.page}/`;
        const out = await new Command("curl", cmd).execute();
        html = out.stdout;
        let doc = document.createElement("div");
        doc.innerHTML = html;

        list = doc.querySelectorAll(".book-card");
        if (!on) {
            running = false;
            updateGui();
            suc("the bot has been safely Stopped");
            onStop();
            return;
        }

        for (let index = config.index; index < list.length; index++) {
            let book = list[index];
            let exists = false;
            let url = book.querySelector(".post-title").children[0].href;
            for (let i = 0; i < json.length; i++) {
                let cmpBook = json[i];
                let title = book
                    .querySelector(".post-title")
                    .children[0].innerHTML.replace("PDF", "")
                    .replace("pdf", "");
                if (cmpBook["title"] == title) {
                    exists = true;
                    break;
                }
            }

            if (exists){
                info(
                    "Book already Exists, skipping"
                );
                continue;
            }

            if (config.repitition && exists) {
                warn(
                    "Book already Exists but repitition is ON, adding book..."
                )
            }

            let code = await getBook(url);
            config["index"] = index;

            if (code == 0) {
                suc(`${index + 1} / ${list.length} - page: ${config["page"]}`);
            }

            updateConfig();
            updateGui();
            if (!on) {
                config.index = index + 1;
                running = false;
                suc("the bot has been safely Stopped");
                updateConfig();
                updateGui();
                onStop();
                return;
            }
        }
        info("Finished page " + config["page"] + ". starting next Page...");
        log("waiting 5 seconds...");
        config["page"]++;
        config["index"] = 0;
        updateConfig();
        updateGui();
        if (!on) {
            running = false;
            updateGui();
            suc("the bot has been safely Stopped");
            onStop();
            return;
        }
        await sleep(5000);
        start();
    } catch (error) {
        err(
            "The bot has crashed with error: \n\n -> "+error+"\n\nplease report this to the developer"
        );
        console.log(error);
        running = false;
        on = false;
    }
}
window.addEventListener("DOMContentLoaded", initApp);
