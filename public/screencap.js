

const video = document.querySelector('.video');
const canvas = document.createElement('canvas');

const constraints = {
  video: {width: {exact: 640}, height: {exact: 480}}
};


$('#start_cap_btn').on('click', function(e) {
  navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);
});

$('#scan_book_btn').on('click', function() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  // Other browsers will fall back to image/png
  $('#barcode_cap').src = canvas.toDataURL('image/webp');
  track.stop();
});

function handleSuccess(stream) {
  $('#scan_book_btn').disabled = false;
  video.srcObject = stream;
}

function handleError(error) {
  console.error('Error: ', error);
}