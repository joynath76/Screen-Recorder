const recordButton = document.getElementById("RecordingButton");

const tabButton = document.getElementById("tab-only")
const desktopButton = document.getElementById("desktop")
const cameraButton = document.getElementById("camera-only")
const audioOptions = document.querySelector("#microphone>select");
const webcamOptions = document.querySelector("#webcam>select");
let currTab = "tab"

tabButton.addEventListener('click', (event)=>{
    changeData();
    tabButton.classList.add("type-active")
    tabButton.getElementsByTagName("img")[0].src = "assets/tab-only-active.svg"
    document.querySelector("#webcam").style.display = "none"
    currTab = "tab-only"
})
desktopButton.addEventListener('click', (event)=>{
    changeData();
    desktopButton.classList.add("type-active")
    desktopButton.getElementsByTagName("img")[0].src = "assets/desktop-active.svg"
    document.querySelector("#webcam").style.display = "none"
    currTab = "desktop"
})
cameraButton.addEventListener('click', (event)=>{
    changeData();
    cameraButton.classList.add("type-active")
    cameraButton.getElementsByTagName("img")[0].src = "assets/camera-only-active.svg"
    document.querySelector("#webcam").style.display = "block"
    currTab = "camera-only"
})

function changeData(){
    const lastActive = document.getElementsByClassName("type-active")[0]
    lastActive.classList.remove("type-active");
    switch(lastActive.id) {
        case "tab-only":
            lastActive.getElementsByTagName("img")[0].src = "assets/tab-only.svg"
            break;
        case "desktop":
            lastActive.getElementsByTagName("img")[0].src = "assets/desktop.svg"
            break;
        case "camera-only":
            lastActive.getElementsByTagName("img")[0].src = "assets/camera-only.svg"
            break;
        default:
            console.log(lastActive.id)
    }
}

chrome.runtime.sendMessage({type: "isRecording"}, response=>{
    if(response.isRecording){
        recordButton.innerHTML = "Stop Recording";
        recordButton.style.backgroundColor = "Red";
        document.querySelector("#microphone>label>input").checked = response.micIsEnabled
        changeData()
        document.querySelector(`#${response.selectedTab}`).classList.add("type-active")
        if(response.selectedTab === "camera-only") document.querySelector("#webcam").style.display = "block"
    }else {
        recordButton.innerHTML = "Start Recording"
        recordButton.style.backgroundColor = "#2D89F4"
    }
})

navigator.mediaDevices.enumerateDevices().then(devices =>{
    const audioDevices = devices.filter(devices => devices.kind === 'audioinput')
    const videoDevices = devices.filter(devices => devices.kind === 'videoinput')
    const audioOption = audioDevices.map(audioDevice => {
        return `<option value="${audioDevice.deviceId}">${audioDevice.label}</option>`;
    })
    audioOptions.innerHTML = audioOption.join("");
    const webcamOption = videoDevices.map(videoDevice => {
        return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
    })
    webcamOptions.innerHTML = webcamOption.join("");
})

recordButton.addEventListener('click', (event) =>{
    if(event.target.innerHTML == "Start Recording"){
        const isAudio = document.querySelector("#microphone>label>input").checked
        const isWebcam = document.querySelector("#webcam>label>input").checked
        if(currTab != "camera"){
            event.target.innerHTML = "Stop Recording";
            event.target.style.backgroundColor = "Red"
            chrome.runtime.sendMessage({type: "startRecording", audio: isAudio, video: true, currTab});
            chrome.browserAction.setIcon({path: 'logo-32-rec.png'});
        }
        else if(currTab === "camera" && isWebcam){
            event.target.innerHTML = "Stop Recording";
            event.target.style.backgroundColor = "Red"
            chrome.runtime.sendMessage({type: "startRecording", audio: isAudio, video: isWebcam, currTab});
            chrome.browserAction.setIcon({path: 'logo-32-rec.png'});
        }
        else{
            alert("Please turn on Video!")
        }
    }
    else if(event.target.innerHTML == "Stop Recording"){
        event.target.innerHTML = "Start Recording"
        event.target.style.backgroundColor = "#2D89F4"
        chrome.runtime.sendMessage({type: "stopRecording"});
        chrome.browserAction.setIcon({path: 'logo-32.png'});
    }
})
chrome.runtime.onMessage.addListener((data, sender, response) => {
    if(!data){
        recordButton.innerHTML = "Start Recording"
        recordButton.style.backgroundColor = "#2D89F4"
        chrome.browserAction.setIcon({path: 'logo-32.png'});
    }
})
