function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 8,
    center: { lat: 40.1553, lng: 26.4142 } // Çanakkale coordinates
  });

  const marker = new google.maps.Marker({
    position: { lat: 40.1553, lng: 26.4142 },
    map: map,
    title: "Sample Wreck"
  });

  marker.addListener('click', function() {
    document.querySelector('.info-panel h2').textContent = "Sample Wreck Title";
    document.querySelector('.info-panel p').textContent = "Sample historical background and dive conditions.";
    document.querySelector('.info-panel img').src = "sample-wreck-photo.jpg";
  });
}
