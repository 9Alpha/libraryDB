

var video = document.getElementById('barcode_vid');
var cap = document.getElementById('barcode_cap')
var canvas = document.createElement('canvas');

var constraints = {
  video: {width: {exact: 640}, height: {exact: 480}}
};


$('#start_cap_btn').on('click', function(e) {
  video.hidden = false;
  cap.hidden = true;
  navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);
});

$('#scan_book_btn').on('click', function() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  cap.src = canvas.toDataURL('image/wpeg');
  video.srcObject.getTracks()[0].stop();
  video.hidden = true;
  cap.hidden = false;
});

function handleSuccess(stream) {
  video.srcObject = stream;
}

function handleError(error) {
  console.error('Error: ', error);
}