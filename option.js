navigator.mediaDevices.getUserMedia({ audio: true, video: true}).then(stream =>{
    let tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
})