let Stream;
let mediaRecorder;
let recordedBlobs;
let isRecording = false;
let micIsEnabled = false;
let selectedTab = 'tab-only'

function addAudioStream(){
    navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(audioStream =>{
        const tracks = audioStream.getAudioTracks()
        tracks.forEach(track => Stream.addTrack(track))  
        startRecording() 
    })
}

chrome.runtime.onMessage.addListener((response, sender, sendResponse)=>{
    if(response.type === "startRecording"){
        micIsEnabled = response.audio
        selectedTab = response.currTab
        if(response.currTab === "tab-only"){
            chrome.tabs.getSelected(null, tab =>{
                console.log(tab)
                chrome.tabCapture.capture({
                    audio: false,
                    video: response.video,
                    videoConstraints: {
                        mandatory: {
                            chromeMediaSource: 'tab',
                            minWidth: tab.width,
                            minHeight: tab.height,
                            maxWidth: tab.width,
                            maxHeight: tab.height,
                            maxFrameRate: 100
                        },
                    }
                }, stream => {
                    Stream = stream
                    if(response.audio) addAudioStream()
                    else startRecording()
                    stream.getVideoTracks()[0].onended = function() {
                        mediaRecorder.stop();
                    }
                })
    
            })
        }
        else if(response.currTab === "desktop"){
            navigator.mediaDevices.getDisplayMedia({audio: false, video: true})
            .then(stream=>{
                Stream = stream;
                if(response.audio) addAudioStream()
                else startRecording()
                stream.getVideoTracks()[0].onended = function() {
                    mediaRecorder.stop();
                }
            })
            .catch(error =>{
                console.log(error)
                chrome.runtime.sendMessage(isRecording)
            })
        }
        else if(response.currTab === "camera-only"){
            navigator.mediaDevices.getUserMedia({audio: response.audio, video: true}).then(stream =>{
                Stream = stream
                startRecording()
            })
        }
    }
    else if(response.type === "stopRecording"){
        mediaRecorder.stop();
        let tracks = Stream.getTracks();
        tracks.forEach(track => track.stop());
    }
    else if(response.type === "isRecording"){
        sendResponse({isRecording, micIsEnabled, selectedTab});
    }
})
function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
}

function startRecording() {
    recordedBlobs = [];
    isRecording = true;
    let options = {mimeType: 'video/webm;codecs=vp9,opus'};
    try {
      mediaRecorder = new MediaRecorder(Stream, options);
    } catch (e) {
      console.error('Exception while creating MediaRecorder:', e);
    }
    mediaRecorder.onstop = (event) => {
        isRecording = false;
        const blob = new Blob(recordedBlobs, {type: 'video/mp4'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        var d = new Date();
        var n = d.toUTCString();
        a.download = n+".mp4";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
}