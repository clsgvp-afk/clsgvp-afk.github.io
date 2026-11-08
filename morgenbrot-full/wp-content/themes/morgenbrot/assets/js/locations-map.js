(()=>{
  'use strict';
  const dialog=document.querySelector('[data-map-dialog]');
  const mapElement=document.querySelector('#morgenbrot-map');
  if(!dialog||!mapElement||!window.L||!window.morgenbrotMapData)return;
  const consent=dialog.querySelector('[data-map-consent]');
  const loadButton=dialog.querySelector('[data-load-map]');
  const closeButton=dialog.querySelector('[data-close-map]');
  const loading=dialog.querySelector('.map-loading');
  const controls=dialog.querySelector('.map-controls');
  const heading=dialog.querySelector('[data-map-title]');
  const markers=new Map();
  let map;
  let selectedId=0;
  const escape=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const showAll=()=>{if(!map)return;const points=[...markers.values()].map(marker=>marker.getLatLng());if(points.length===1)map.setView(points[0],14);else if(points.length)map.fitBounds(L.latLngBounds(points),{padding:[35,35]});};
  const focusMarker=id=>{const marker=markers.get(Number(id));if(!marker)return;map.setView(marker.getLatLng(),15);marker.openPopup();setTimeout(()=>mapElement.focus(),50);};
  const createMap=()=>{
    if(map){focusMarker(selectedId);return;}
    loadButton.disabled=true;loading.hidden=false;
    setTimeout(()=>{
      consent.hidden=true;loading.hidden=true;mapElement.hidden=false;controls.hidden=false;
      map=L.map(mapElement,{scrollWheelZoom:false});
      L.tileLayer(morgenbrotMapData.tiles,{maxZoom:19,attribution:morgenbrotMapData.attribution}).addTo(map);
      morgenbrotMapData.locations.forEach(location=>{
        const popup=`<strong>${escape(location.title)}</strong><br>${escape(location.address)}<br><span class="status ${escape(location.statusClass)}">${escape(location.status)}</span>${location.hours?`<br>Heute: ${escape(location.hours)}`:''}<br><a href="${escape(location.url)}">Details</a>`;
        markers.set(Number(location.id),L.marker([location.lat,location.lng],{title:location.title,alt:location.title}).addTo(map).bindPopup(popup));
      });
      map.invalidateSize();focusMarker(selectedId);
    },40);
  };
  document.querySelectorAll('[data-focus-marker]').forEach(button=>button.addEventListener('click',()=>{
    selectedId=Number(button.dataset.focusMarker);heading.textContent=button.dataset.locationTitle||'Filiale auf der Karte';
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    if(map){setTimeout(()=>{map.invalidateSize();focusMarker(selectedId);},50);}
  }));
  loadButton.addEventListener('click',createMap);
  closeButton.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('cancel',()=>{});
  dialog.querySelector('[data-show-all]')?.addEventListener('click',showAll);
})();
