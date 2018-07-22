console.log("quagga script loaded");

Quagga.init({
    inputStream: {
      name: "barcode_scan",
      type: "LiveStream",
      target: "#barcode_vid"
    },
    decoder: {
      readers: ["ean_reader"]
    }
  }, function(err) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Initialization finished. Ready to start");
    Quagga.start();
  });




var video = document.getElementById('barcode_vid');
$('#start_cap_btn').on('click', function(e) {
  video.hidden = false;
  Quagga.init();
});
