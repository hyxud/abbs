const { invoke } = window.__TAURI__.tauri;
const { createDir, BaseDirectory } = window.__TAURI__.fs
const {homeDir, resolve} = window.__TAURI__.path

let logDiv;
let scroll = true;
let homePath
let pdfPath
let imgPath
let jsonPath
let pdfPathInput
let imgPathInput
let jsonPathInput
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function updateScroll(){
  if (scroll) {
    logDiv.scrollTop = logDiv.scrollHeight;
  }
}
function err(string) {
  logDiv.innerHTML = logDiv.innerHTML + "<p class='red'>Error: " + string + "</p>"
  updateScroll()
}
function suc(string) {
  logDiv.innerHTML = logDiv.innerHTML + "<p class='green'>" + string + "</p>"
  updateScroll()
}
function inf(string) {
  logDiv.innerHTML = logDiv.innerHTML + "<p class='blue'>Info: " + string + "</p>"
  updateScroll()
}
function log(string) {
  logDiv.innerHTML = logDiv.innerHTML + "<p class='white'>" + string + "</p>"
  updateScroll()
}

function start() {
  
}
function kill() {
  log("KIlled")
}
async function initApp() {
  logDiv = document.getElementById("log")
  document.getElementById("start").addEventListener("click", start)
  document.getElementById("stop").addEventListener("click", kill)

  pdfPathInput = document.getElementById("pdf")
  imgPathInput = document.getElementById("img")
  jsonPathInput = document.getElementById("json")


  homePath = await homeDir()

  document.getElementById("pdf-p").innerHTML = homePath
  document.getElementById("img-p").innerHTML = homePath
  document.getElementById("json-p").innerHTML = homePath

  pdfPath = homePath
  imgPath = homePath
  jsonPath = homePath

  pdfPathInput.addEventListener('change', async (e)=>{pdfPath = await resolve(homePath, e.target.value)})
  imgPathInput.addEventListener('change', async (e)=>{imgPath = await resolve(homePath, e.target.value)})
  jsonPathInput.addEventListener('change', async (e)=>{jsonPath = await resolve(homePath, e.target.value)})

  document.getElementById("autoscroll").addEventListener('change',(e)=>{
    scroll = e.target.checked
  })
}


window.addEventListener("DOMContentLoaded", initApp);
