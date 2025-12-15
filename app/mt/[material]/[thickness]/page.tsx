import MaterialThickness from "@/components/MaterialThickness";
import { Imported, MTSession, Task } from "@/lib/db";

type Props = {
  params: {
    material: string;
    thickness: string;
  }
}

export default async function MT(props: Props) {
  const params = await props.params;
  const material = decodeURIComponent(params.material);
  const thickness = +decodeURIComponent(params.thickness);
  const sessionDoc = await MTSession.findOne({ material, thickness });
  const partCounts = Object.fromEntries((await Task.aggregate([
    {
      $match: {
        Material: material,
        Thickness: thickness,
      }
    },
    { $unwind: "$Parts" },
    {
      $group: {
        _id: "$Parts",
        count: { $sum: 1 }
      }
    }
  ])).map(item => [item._id, item.count]));
  const imported = await Imported.find({
    child: { $in: Object.keys(partCounts) }
  });
  console.log(imported);
  return <MaterialThickness sessionDoc={JSON.stringify(sessionDoc)} />
}

/*
<script>
const selected = new Map();
let platesState = [];
let sortables = [];
const initialSelected = {{ (initial_selected or [])|tojson }};
const initialPlates = {{ (initial_plates or [])|tojson }};
const initialAssignments = {{ (initial_assignments or [])|tojson }};
let saveTimer = null;
let lastUpdated = '{{ updated_at or "" }}';
let lastUpdatedBy = '{{ updated_by or "" }}';
let suppressPoll = false;

// Build a lookup for display names once
const PARTS_INFO = {{ (parts_info or [])|tojson }};
const DISPLAY_BY_ID = Object.fromEntries((PARTS_INFO || []).map(p => [p.id, p.display]));

function setUpdated(ts){
  lastUpdated = ts || '';
  document.getElementById('updatedAt').textContent = lastUpdated;
}

function debounceSave(){
  if(saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persistState, 400);
}

async function persistState(){
  try{
    const resp = await fetch(`{{ url_for('main.save_mt_session', material_enc=material|tojson|safe, thickness_enc=thickness|tojson|safe) }}`.replaceAll('"',''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_parts: Array.from(selected.entries()).map(([id,q])=>({id, quantity:q})),
        plates: platesState,
        assignments: collectAssignments(),
      })
    });
    if(resp.ok){
      // fetch fresh stamp
      await pollOnce();
    }
  } catch(e) {}
}

async function pollOnce(){
  try{
    if (suppressPoll) return;
    const url = `{{ url_for('main.mt_state', material_enc=material|tojson|safe, thickness_enc=thickness|tojson|safe) }}`.replaceAll('"','');
    const resp = await fetch(url);
    if(!resp.ok) return;
    const data = await resp.json();
    // Always refresh timestamps and CAM-related info, but avoid overwriting local selections
    // to prevent counters from \"jumping\" while the user is editing.
    setUpdated(data.updatedAt || lastUpdated);
    lastUpdatedBy = data.updatedBy || lastUpdatedBy;
    const updatedBy = data.updatedBy || '';
    const isWebhookUpdate = updatedBy.startsWith('webhook');
    // Update CAM-related plate metadata without touching current selections.
    const incomingPlates = (data.plates || []).map(p => ({
      id: p.plateId || p.id || uuidv4(),
      Width: p.Width || 24,
      Length: p.Length || 48,
      trueDepth: p.trueDepth || {{ thickness|tojson }},
      verifiedSignature: p.verifiedSignature || '',
      cam_download_url: p.cam_download_url || '',
      cam_bundle_rel: p.cam_bundle_rel || '',
      screenshot_url: p.screenshot_url || ''
    }));
    // Merge incoming plate CAM metadata into existing platesState by id,
    // but do not add new plates or overwrite dimensions so that plate edits
    // only propagate from the server on initial page load.
    const byId = new Map(platesState.map(p => [p.id, p]));
    incomingPlates.forEach(p => {
      const existing = byId.get(p.id);
      if (existing) {
        existing.verifiedSignature = p.verifiedSignature;
        existing.cam_download_url = p.cam_download_url;
        existing.cam_bundle_rel = p.cam_bundle_rel;
        existing.screenshot_url = p.screenshot_url;
      }
    });
    // Update plate Download buttons and Box Tube download links
    refreshPlateDownloads();
    if (Array.isArray(data.tube_bundles)) {
      data.tube_bundles.forEach(tb => {
        const pid = tb.partId;
        const url = tb.cam_download_url;
        if (!pid || !url) return;
        const row = document.querySelector(`[data-tube-status-for=\"${CSS.escape(pid)}\"]`)?.closest('li');
        if (!row) return;
        // If a Download button doesn't exist yet for this tube, create one
        let dl = row.querySelector('[data-tube-download]');
        if (!dl) {
          const container = row.querySelector('.d-flex.align-items-center.gap-2');
          if (!container) return;
          dl = document.createElement('a');
          dl.className = 'btn btn-sm btn-outline-primary';
          dl.setAttribute('data-tube-download', pid);
          dl.target = '_blank';
          dl.rel = 'noopener noreferrer';
          dl.textContent = 'Download';
          container.insertBefore(dl, row.querySelector(`[data-tube-status-for=\"${CSS.escape(pid)}\"]`));
        }
        dl.href = url;
      });
    }
    // If this update came from the CAM server (webhook), trust server-side
    // assignments and re-sync tokens from data.assignments.
    if (isWebhookUpdate) {
      // Clear all plate assignment lists
      platesState.forEach(p => {
        const ul = document.getElementById(`assign-${p.id}`);
        if (ul) ul.innerHTML = '';
      });
      // Rebuild tokens per plate from server assignments
      (data.assignments || []).forEach(({plateId, parts}) => {
        const ul = document.getElementById(`assign-${plateId}`);
        if (!ul) return;
        (parts || []).forEach(({id, quantity}) => {
          for (let i = 0; i < (quantity || 0); i++) {
            ul.appendChild(tokenLi(id));
          }
        });
      });
    }

    // Re-apply unassigned tokens and CAM button visibility from current DOM/selection
    rebuildAssignmentTokens();
    syncPayloadAndEnable();
    updateCamButtons();
    // Clear cooking state if a bundle or screenshot arrived
    platesState.forEach(p => {
      if (p.cam_download_url || p.screenshot_url) {
        setCamCooking(p.id, false);
        const st = document.getElementById(`cam-status-${p.id}`);
        if (st) {
          st.textContent = p.cam_download_url ? 'Bundle ready' : 'Screenshot updated';
          st.classList.add('ready');
        }
      }
    });
  // Ensure any new screenshots have corresponding modals/buttons without re-rendering plates
  refreshPlateScreenshots();
  } catch(e) {}
}

setInterval(pollOnce, 3000);

function encode(name){
  return CSS.escape(name);
}

function incQty(id){
  const el = document.getElementById(`qty-${encode(id)}`);
  el.value = (parseInt(el.value || '0', 10) + 1).toString();
  updateSelection(id);
}
function decQty(id){
  const el = document.getElementById(`qty-${encode(id)}`);
  el.value = Math.max(0, parseInt(el.value || '0', 10) - 1).toString();
  updateSelection(id);
}
function trimAssignedToSelectionFor(pid){
  const target = selected.get(pid) || 0;
  const assignedLis = [];
  platesState.forEach(p => {
    const ul = document.getElementById(`assign-${p.id}`);
    if(!ul) return;
    ul.querySelectorAll('li').forEach(li => { if(li.dataset.partId === pid){ assignedLis.push(li); } });
  });
  let extra = assignedLis.length - target;
  while(extra > 0 && assignedLis.length){
    const li = assignedLis.pop();
    if(li && li.parentElement){ li.parentElement.removeChild(li); }
    extra--;
  }
}

function updateSelection(id){
  const el = document.getElementById(`qty-${encode(id)}`);
  const qty = parseInt(el.value || '0', 10);
  if(qty > 0){ selected.set(id, qty); } else { selected.delete(id); }
  // Immediately trim assigned tokens for this id if decreased
  trimAssignedToSelectionFor(id);
  rebuildAssignmentTokens();
  syncPayloadAndEnable();
  debounceSave();
  // Keep epic Insert/Remove buttons in sync with current quantities
  refreshAllEpicButtons();
}

function snapshotAssignments(){
  const perPlate = new Map();
  platesState.forEach(p => {
    const ul = document.getElementById(`assign-${p.id}`);
    if(!ul) { perPlate.set(p.id, []); return; }
    const arr = [];
    ul.querySelectorAll('li').forEach(li => arr.push(li.dataset.partId));
    perPlate.set(p.id, arr);
  });
  // Compute remaining (unassigned) from DOM as well
  const unassigned = [];
  const unEl = document.getElementById('assign-unassigned');
  if(unEl){ unEl.querySelectorAll('li').forEach(li => unassigned.push(li.dataset.partId)); }
  return { perPlate, unassigned };
}

function tokenLi(pid){
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-center';
  li.dataset.partId = pid;
  const name = DISPLAY_BY_ID[pid] || pid;
  li.innerHTML = `<span>${name}</span><span className="badge bg-primary">1</span>`;
  return li;
}

function addPlate(){
  const snap = snapshotAssignments();
  const newPlate = { id: uuidv4(), Width: 24, Length: 48, trueDepth: {{ thickness|tojson }} };
  platesState.push(newPlate);
  renderPlates(snap);
  debounceSave();
}
function removePlate(pid){
  const snap = snapshotAssignments();
  platesState = platesState.filter(p => p.id !== pid);
  renderPlates(snap);
  debounceSave();
}
function onPlateField(pid, field, value){
  const p = platesState.find(x => x.id === pid);
  if(!p) return;
  const num = Number(value);
  p[field] = isNaN(num) ? 0 : num;
  syncPayloadAndEnable();
  debounceSave();
}
function renderPlates(snap){
  const ul = document.getElementById('platesList');
  ul.innerHTML = '';
  platesState.forEach((p, idx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerHTML = `
      <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
        <div>
          <div className="small text-white-50">Plate ${idx+1}</div>
          <div className="row g-2">
            <div className="col-4">
              <label className="form-label small">Width</label>
              <input type="number" step="0.01" min="0" className="form-control text-white form-control-sm gh-input" value="${p.Width}" onchange="onPlateField('${p.id}','Width',this.value)">
            </div>
            <div className="col-4">
              <label className="form-label small">Length</label>
              <input type="number" step="0.01" min="0" className="form-control text-white form-control-sm gh-input" value="${p.Length}" onchange="onPlateField('${p.id}','Length',this.value)">
            </div>
            <div className="col-4">
              <label className="form-label small">True Depth</label>
              <input type="number" step="0.001" min="0" className="form-control form-control-sm gh-input text-white" value="${p.trueDepth||0}" onchange="onPlateField('${p.id}','trueDepth',this.value)">
            </div>
          </div>
        </div>
        <div>
          <button type="button" className="btn btn-sm btn-danger" onclick="removePlate('${p.id}')">Remove</button>
        </div>
      </div>`;
    ul.appendChild(li);
  });
  rebuildAssignmentLayout();
  // Restore assignments if snapshot provided
  if(snap){
    platesState.forEach(p => {
      const arr = snap.perPlate.get(p.id) || [];
      const list = document.getElementById(`assign-${p.id}`);
      arr.forEach(pid => list && list.appendChild(tokenLi(pid)));
    });
  }
  rebuildAssignmentTokens();
  syncPayloadAndEnable();
  updateCamButtons();
}

function formValid(){
  if(selected.size === 0) return false;
  if(platesState.length === 0) return false;
  return platesState.every(p => (p.Width>0 && p.Length>0 && p.trueDepth>0));
}

function syncPayloadAndEnable(){
  document.getElementById('selected_parts_json').value = JSON.stringify(Array.from(selected.entries()).map(([pid,q])=>({id:pid, quantity:q})));
  document.getElementById('plates_json').value = JSON.stringify(platesState);
  document.getElementById('plate_parts_json').value = JSON.stringify(collectAssignments());
  document.getElementById('submitBtn').disabled = !formValid();
  document.getElementById('assignCard').style.display = formValid() ? '' : 'none';
  updateCamButtons();
}

function selectAllRecommended(){
  {% for p in parts_info %}
  const el_{{ loop.index }} = document.getElementById(`qty-{{ p.id }}`);
  if(el_{{ loop.index }}){ el_{{ loop.index }}.value = String({{ p.recommended }}); }
  if({{ p.recommended }}){ selected.set("{{ p.id }}", {{ p.recommended }}); } else { selected.delete("{{ p.id }}"); }
  {% endfor %}
  rebuildAssignmentTokens();
  syncPayloadAndEnable();
  debounceSave();
  refreshAllEpicButtons();
}

// Drag-and-drop assignment
function clearSortables(){
  sortables.forEach(s => s.destroy && s.destroy());
  sortables = [];
}

function moveAllUnassignedToPlate(plateId){
  const unassigned = document.getElementById('assign-unassigned');
  const target = document.getElementById(`assign-${plateId}`);
  if(!unassigned || !target) return;
  const items = Array.from(unassigned.querySelectorAll('li'));
  items.forEach(li => target.appendChild(li));
  syncPayloadAndEnable();
  debounceSave();
}

function rebuildAssignmentLayout(){
  const container = document.getElementById('assignPlates');
  container.innerHTML = '';
  platesState.forEach((p, idx) => {
    const col = document.createElement('div');
    col.className = 'mb-3';
    const modal = '';
    col.innerHTML = `
      <div id="plate-box-${p.id}" className="gh-box p-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="small text-white-50">Plate ${idx+1}</div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-primary" onclick="moveAllUnassignedToPlate('${p.id}')">Fill with Unassigned</button>
          </div>
        </div>
        <ul id="assign-${p.id}" className="list-group list-group-flush min-vh-25" style="min-height:220px;"></ul>
        <div id="cam-controls-${p.id}" className="mt-2" style="display:none;">
          <form onsubmit="return sendCam('${p.id}', this)">
            <div className="d-flex align-items-center gap-2">
              <select name="machine" className="form-select form-select-sm text-white gh-input d-inline w-auto">
                <option value="IQ">IQ</option>
                <option value="Swift">Swift</option>
              </select>
              <button className="btn btn-sm btn-primary" type="submit">CAM</button>
              <span id="cam-status-${p.id}" className="cam-status"></span>
            </div>
          </form>
        </div>
      </div>
      ${modal}`;
    container.appendChild(col);
  });
  initSortable();
}

function rebuildAssignmentTokens(){
  // Trim assigned tokens if selection decreased
  const pidSet = new Set();
  selected.forEach((_, pid) => pidSet.add(pid));
  platesState.forEach(p => {
    const ul = document.getElementById(`assign-${p.id}`);
    if(!ul) return;
    ul.querySelectorAll('li').forEach(li => pidSet.add(li.dataset.partId));
  });
  pidSet.forEach(pid => {
    const target = selected.get(pid) || 0;
    // collect all assigned tokens for this pid across plates
    const assignedLis = [];
    platesState.forEach(p => {
      const ul = document.getElementById(`assign-${p.id}`);
      if(!ul) return;
      ul.querySelectorAll('li').forEach(li => { if(li.dataset.partId === pid){ assignedLis.push(li); } });
    });
    let extra = assignedLis.length - target;
    while(extra > 0 && assignedLis.length){
      const li = assignedLis.pop();
      if(li && li.parentElement){ li.parentElement.removeChild(li); }
      extra--;
    }
  });

  // Build tokens in unassigned based on selected quantities minus assigned counts
  const unassigned = document.getElementById('assign-unassigned');
  if(!unassigned) return;
  const assignedCounts = aggregateAssignedCounts();
  unassigned.innerHTML = '';
  for(const [pid, total] of selected.entries()){
    const assigned = assignedCounts.get(pid) || 0;
    const remaining = Math.max(0, total - assigned);
    for(let i=0;i<remaining;i++){
      unassigned.appendChild(tokenLi(pid));
    }
  }
}

function initSortable(){
  clearSortables();
  const lists = [document.getElementById('assign-unassigned')];
  platesState.forEach(p => lists.push(document.getElementById(`assign-${p.id}`)) );
  lists.forEach(list => {
    if(!list) return;
    const s = new Sortable(list, {
      group: 'assign',
      animation: 150,
      onAdd(){ syncPayloadAndEnable(); rebuildAssignmentTokens(); debounceSave(); },
      onEnd(){ syncPayloadAndEnable(); rebuildAssignmentTokens(); debounceSave(); },
    });
    sortables.push(s);
  });
}

function aggregateAssignedCounts(){
  const counts = new Map();
  platesState.forEach(p => {
    const ul = document.getElementById(`assign-${p.id}`);
    if(!ul) return;
    ul.querySelectorAll('li').forEach(li => {
      const pid = li.dataset.partId;
      counts.set(pid, (counts.get(pid)||0) + 1);
    });
  });
  return counts;
}

function collectAssignments(){
  const res = [];
  platesState.forEach(p => {
    const ul = document.getElementById(`assign-${p.id}`);
    if(!ul) return;
    const counts = new Map();
    ul.querySelectorAll('li').forEach(li => {
      const pid = li.dataset.partId;
      counts.set(pid, (counts.get(pid)||0) + 1);
    });
    const parts = Array.from(counts.entries()).map(([id,q])=>({id, quantity:q}));
    res.push({ plateId: p.id, parts });
  });
  return res;
}

function autoPropagate(){
  // Move remaining tokens from unassigned to Plate 1
  const unassigned = document.getElementById('assign-unassigned');
  if(!platesState.length) return;
  const firstPlateUl = document.getElementById(`assign-${platesState[0].id}`);
  if(!unassigned || !firstPlateUl) return;
  const items = Array.from(unassigned.querySelectorAll('li'));
  items.forEach(li => firstPlateUl.appendChild(li));
  syncPayloadAndEnable();
  debounceSave();
}

function unassignAll(){
  const unassigned = document.getElementById('assign-unassigned');
  platesState.forEach(p => {
    const ul = document.getElementById(`assign-${p.id}`);
    if(!ul) return;
    const items = Array.from(ul.querySelectorAll('li'));
    items.forEach(li => unassigned.appendChild(li));
  });
  syncPayloadAndEnable();
  debounceSave();
}

function currentPlateSignature(plateId){
  const ul = document.getElementById(`assign-${plateId}`);
  if(!ul) return '';
  const counts = new Map();
  ul.querySelectorAll('li').forEach(li => {
    const pid = li.dataset.partId;
    counts.set(pid, (counts.get(pid)||0)+1);
  });
  return Array.from(counts.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([pid,q])=>`${pid}:${q}`).join(',');
}

function updateCamButtons(){
  platesState.forEach(p => {
    const ctrl = document.getElementById(`cam-controls-${p.id}`);
    const box = document.getElementById(`plate-box-${p.id}`);
    if(!ctrl || !box) return;
    const hasParts = (document.getElementById(`assign-${p.id}`)?.querySelectorAll('li').length || 0) > 0;
    const sigOk = (p.verifiedSignature || '') === currentPlateSignature(p.id);
    const show = hasParts && sigOk;
    ctrl.style.display = show ? '' : 'none';
    if(show){ box.classList.add('plate-ready'); } else { box.classList.remove('plate-ready'); }
  });
}

function refreshPlateScreenshots(){
  // Ensure screenshot modals/buttons exist for plates with screenshot_url, without
  // rebuilding the entire plate layout so drag-and-drop stays client-side.
  platesState.forEach(p => {
    const plateId = p.id;
    const url = p.screenshot_url;
    const box = document.getElementById(`plate-box-${plateId}`);
    if (!box) return;
    const modalId = `shot-${plateId}`;
    let modal = document.getElementById(modalId);
    if (url) {
      // Create or update modal
      if (!modal) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
        <div className="modal fade screenshot-modal" id="${modalId}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Plate Screenshot</h6>
                <button type="button" className="btn-close bg-white" data-bs-dismiss="modal" aria-label="Close" style="filter:none;"></button>
              </div>
              <div className="modal-body"><img src="${url}" className="img-fluid screenshot-img"/></div>
            </div>
          </div>
        </div>`;
        const modalEl = wrapper.firstElementChild;
        if (modalEl) {
          document.body.appendChild(modalEl);
          modal = modalEl;
        }
      } else {
        const img = modal.querySelector('.screenshot-img');
        if (img) img.src = url;
      }
      // Ensure "View Screenshot" button exists in cam controls
      const controls = document.getElementById(`cam-controls-${plateId}`);
      if (!controls) return;
      let btn = controls.querySelector('[data-plate-screenshot-btn]');
      if (!btn) {
        const statusSpan = controls.querySelector(`#cam-status-${plateId}`);
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm btn-outline-success';
        btn.setAttribute('data-bs-toggle', 'modal');
        btn.setAttribute('data-bs-target', `#${modalId}`);
        btn.setAttribute('data-plate-screenshot-btn', plateId);
        btn.textContent = 'View Screenshot';
        const container = controls.querySelector('.d-flex.align-items-center.gap-2') || controls.firstElementChild;
        if (container) {
          container.insertBefore(btn, statusSpan || null);
        }
      } else {
        btn.setAttribute('data-bs-target', `#${modalId}`);
      }
    }
  });
}

function refreshPlateDownloads(){
  // Ensure plate Download buttons reflect the latest cam_download_url.
  platesState.forEach(p => {
    const plateId = p.id;
    const url = p.cam_download_url;
    const controls = document.getElementById(`cam-controls-${plateId}`);
    if (!controls) return;
    let link = controls.querySelector('[data-plate-download]');
    if (url) {
      if (!link) {
        const statusSpan = controls.querySelector(`#cam-status-${plateId}`);
        link = document.createElement('a');
        link.className = 'btn btn-sm btn-outline-primary';
        link.setAttribute('data-plate-download', plateId);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Download';
        const container = controls.querySelector('.d-flex.align-items-center.gap-2') || controls.firstElementChild;
        if (container) {
          container.insertBefore(link, statusSpan || null);
        }
      }
      link.href = url;
      link.style.display = '';
    } else if (link) {
      // Hide or remove Download button if no bundle is available
      link.remove();
    }
  });
}

function setCamCooking(plateId, cooking){
  const box = document.getElementById(`plate-box-${plateId}`);
  const status = document.getElementById(`cam-status-${plateId}`);
  if(!box) return;
  if(cooking){
    box.classList.add('plate-cooking');
    if(status){ status.textContent = 'Sending to CAM...'; status.classList.remove('ready','error'); }
  } else {
    box.classList.remove('plate-cooking');
    if(status){ status.textContent = ''; status.classList.remove('ready','error'); }
  }
}

function sendCam(plateId, form){
  const plate = platesState.find(p => p.id === plateId);
  if(!plate) return false;
  const ul = document.getElementById(`assign-${plateId}`);
  const counts = new Map();
  ul.querySelectorAll('li').forEach(li => { const pid=li.dataset.partId; counts.set(pid,(counts.get(pid)||0)+1); });
  const parts = Array.from(counts.entries()).map(([id,q])=>({name:id, quantity:q}));
  const machine = form.querySelector('select[name="machine"]').value || 'IQ';
  const body = {
    material: {{ material|tojson }},
    trueDepth: plate.trueDepth,
    width: plate.Width,
    length: plate.Length,
    machine: machine,
    parts: parts,
    thickness: {{ (thickness|string)|tojson }}
  };
  setCamCooking(plateId, true);
  fetch(`/mt/${encodeURIComponent({{ material|tojson }}.replaceAll('"',''))}/${encodeURIComponent(String({{ (thickness|string)|tojson }}).replaceAll('"',''))}/cam_json/${plateId}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then(()=>{ debounceSave(); setTimeout(pollOnce, 1000); }).catch(()=>{ setCamCooking(plateId, false); });
  return false;
}

function camTube(partId, btn){
  const statusEl = document.querySelector(`[data-tube-status-for=\"${CSS.escape(partId)}\"]`);
  if(statusEl){ statusEl.textContent = 'Sending to CAM...'; }
  if(btn){ btn.disabled = true; }
  const m = encodeURIComponent({{ material|tojson }}.replaceAll('"',''));
  const t = encodeURIComponent(String({{ (thickness|string)|tojson }}).replaceAll('"',''));
  fetch(`/mt/${m}/${t}/cam_tube/${encodeURIComponent(partId)}`, {
    method: 'POST',
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  }).then(resp => {
    if(statusEl){
      if(resp.ok){
        statusEl.textContent = 'CAM request sent';
      } else {
        statusEl.textContent = 'Error sending CAM';
      }
    }
  }).catch(() => {
    if(statusEl){ statusEl.textContent = 'Error sending CAM'; }
  }).finally(() => {
    if(btn){ btn.disabled = false; }
  });
}

function isEpicAtRecommended(epic){
  let any = false;
  let allMatch = true;
  (PARTS_INFO || []).forEach(p => {
    if (p.epic === epic) {
      any = true;
      const rec = Number(p.recommended) || 0;
      const el = document.getElementById(`qty-${encode(p.id)}`);
      const current = el ? Number(el.value || '0') : 0;
      if (current !== rec) {
        allMatch = false;
      }
    }
  });
  return any && allMatch;
}

function updateEpicButtonLabel(epic){
  const btn = document.querySelector(`.epic-toggle-btn[data-epic=\"${CSS.escape(epic)}\"]`);
  if (!btn) return;
  if (isEpicAtRecommended(epic)) {
    btn.textContent = 'Remove';
  } else {
    btn.textContent = 'Insert';
  }
}

function refreshAllEpicButtons(){
  const buttons = document.querySelectorAll('.epic-toggle-btn[data-epic]');
  buttons.forEach(btn => {
    const epic = btn.getAttribute('data-epic') || '';
    updateEpicButtonLabel(epic);
  });
}

function toggleEpic(epic, btn){
  const atRec = isEpicAtRecommended(epic);
  (PARTS_INFO || []).forEach(p => {
    if (p.epic === epic) {
      const targetQty = atRec ? 0 : (Number(p.recommended) || 0);
      const el = document.getElementById(`qty-${encode(p.id)}`);
      if (!el) return;
      el.value = String(targetQty);
      if (targetQty > 0) {
        selected.set(p.id, targetQty);
      } else {
        selected.delete(p.id);
      }
    }
  });
  rebuildAssignmentTokens();
  syncPayloadAndEnable();
  debounceSave();
  updateEpicButtonLabel(epic);
}

// Initialize from server state
(function initFromServer(){
  setUpdated('{{ updated_at or "" }}');
  // Selected
  (initialSelected || []).forEach(({id, quantity}) => {
    const el = document.getElementById(`qty-${encode(id)}`);
    if(el){ el.value = String(quantity); selected.set(id, quantity); }
  });
  // Plates (carry additional fields)
  if(Array.isArray(initialPlates) && initialPlates.length){
    platesState = initialPlates.map(p => ({
      id: p.id || uuidv4(),
      Width: p.Width||24,
      Length: p.Length||48,
      trueDepth: p.trueDepth||{{ thickness|tojson }},
      verifiedSignature: p.verifiedSignature || '',
      cam_download_url: p.cam_download_url || '',
        cam_bundle_rel: p.cam_bundle_rel || '',
      screenshot_url: p.screenshot_url || ''
    }));
  }
  renderPlates();
  // Assignments
  (initialAssignments || []).forEach(({plateId, parts}) => {
    const ul = document.getElementById(`assign-${plateId}`);
    if(!ul) return;
    (parts||[]).forEach(({id, quantity}) => {
      for(let i=0;i<quantity;i++) ul.appendChild(tokenLi(id));
    });
  });
  rebuildAssignmentTokens();
  syncPayloadAndEnable();
  updateCamButtons();
  refreshAllEpicButtons();
  refreshPlateDownloads();
  refreshPlateScreenshots();
})();

// Pause polling when screenshot modal is open to avoid re-rendering under the modal
document.addEventListener('shown.bs.modal', function (e) {
  if (e.target && e.target.classList.contains('screenshot-modal')) {
    suppressPoll = true;
  }
});
document.addEventListener('hidden.bs.modal', function (e) {
  if (e.target && e.target.classList.contains('screenshot-modal')) {
    suppressPoll = false;
    setTimeout(pollOnce, 100);
  }
});
</script>
 */