"use client";

import { ChangeEvent, useState } from "react";

type Plate = {
  id: string;
  Width: number;
  Length: number;
  trueDepth: number;
}

type Assignment = {
  plateId: string;
  parts: { id: string; quantity: number }[];
}

type Parts = {
  boxTubes: {
    quantity: number;
    available: number;
    id: string;
    name: string;
  }[];
  epics: Record<string, {
    id: string;
    name: string;
    quantity: number;
    available: number;
  }[]>
}

export default function MaterialThickness({ sessionDoc, parts }: { sessionDoc: string, parts: Parts }) {
  function addPlate() {
    const id = crypto.randomUUID();
    setPlates(prev => [...prev, {
      id,
      Width: 24,
      Length: 48,
      trueDepth: session.thickness
    }]);

    setAssignments(prev => [...prev, {
      plateId: id,
      parts: []
    }]);
  }

  function removePlate(plateId: string) {
    setPlates(p => p.filter(pl => pl.id !== plateId));
    setAssignments(a => a.filter(as => as.plateId !== plateId));
  }

  function updatePlate(plateId: string, field: keyof Plate, value: number) {
    setPlates(prev => prev.map(p => (
      p.id === plateId ? { ...p, [field]: value } : p
    )));
  }

  function toggleEpic(name: string) {
    setQuantities(prev => {
      const next = { ...prev };
      const atRecommended = epicAtRecommended(name);
      for (const part of parts.epics[name])
        next[part.id] = atRecommended ? 0 : part.quantity;

      return next;
    });
  }

  function epicAtRecommended(epic: string) {
    return parts.epics[epic].every(p => quantities[p.id] === p.quantity)
  }

  function selectAllQuantities() {
    let quantities: Record<string, number> = {}
    for (const part of Object.values(parts.epics).flat())
      quantities[part.id] = part.quantity;
    return quantities;
  }

  const session = JSON.parse(sessionDoc);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quantities, setQuantities] = useState(selectAllQuantities);

  return <div className="row">
    <div className="col-md-4">
      <div className="card gh-box mb-3">
        <div className="card-body">
          <h5>Material · Thickness</h5>
          <div className="text-white-50"><strong>Material:</strong> {session.material}</div>
          <div className="text-white-50"><strong>Thickness:</strong> {session.thickness}</div>
          <form id="breakdownForm" method="post" action={`/mt/${encodeURIComponent(session.material)}/${encodeURIComponent(session.thickness)}/auto_breakdown`} className="mt-3">
            <input type="hidden" name="selected_parts_json" id="selected_parts_json" />
            <input type="hidden" name="plates_json" id="plates_json" />
            <input type="hidden" name="plate_parts_json" id="plate_parts_json" />
            <button id="submitBtn" className="btn btn-primary" disabled>Request Auto Breakdown</button>
            <div className="form-text mt-2 text-danger">Select at least one part and add at least one plate to proceed.</div>
            <div className="form-text small text-white-50">Last updated: <span id="updatedAt">{session.updatedAt}</span></div>
          </form>
        </div>
      </div>
      <div className="card gh-box">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="m-0">Plates to Create</h6>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addPlate}>Add Plate</button>
          </div>
          <ul className="list-group list-group-flush">{plates.map((plate, idx) => (
            <li key={plate.id} className="list-group-item">
              <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
                <div>
                  <div className="small text-white-50">Plate {idx + 1}</div>
                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label small">Width</label>
                      <input type="number" step="0.01" min="0" className="form-control text-white form-control-sm gh-input" value={plate.Width} onChange={e => updatePlate(plate.id, "Width", +e.target.value)} />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Length</label>
                      <input type="number" step="0.01" min="0" className="form-control text-white form-control-sm gh-input" value={plate.Length} onChange={e => updatePlate(plate.id, "Length", +e.target.value)} />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">True Depth</label>
                      <input type="number" step="0.001" min="0" className="form-control form-control-sm gh-input text-white" value={plate.trueDepth} onChange={e => updatePlate(plate.id, "trueDepth", +e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removePlate(plate.id)}>Remove</button>
                </div>
              </div>
            </li>
          ))}</ul>
        </div>
      </div>
    </div>
    <div className="col-md-8">
      <div className="card gh-box mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="m-0">Available Parts by Epic</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setQuantities(selectAllQuantities())}>Select All (Recommended)</button>
          </div>
          <div style={{ maxHeight: "420px", overflow: "auto" }}>
            {parts.boxTubes.length || parts.epics.length ? <>
              {parts.boxTubes.length && <>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-semibold text-white-50">Box Tubes</span>
                </div>
                <ul className="list-group list-group-flush">
                  {parts.boxTubes.map(tube => (
                    <li key={tube.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">{tube.name}</div>
                        <div className="small text-white-50">
                          ID: {tube.id} • Recommended: {tube.quantity}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {/* <button className="btn btn-sm btn-primary" type="button" onclick="camTube('{{ t.id }}', this)">CAM (IQ)</button>
                       {% if t.cam_download_url %}
                       <a
                         className="btn btn-sm btn-outline-primary"
                         data-tube-download="{{ t.id }}"
                         href="{{ t.cam_download_url }}"
                         target="_blank"
                         rel="noopener noreferrer"
                       >Download</a>
                       {% endif %} */}
                        <span className="small text-white-50"></span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>}
              {Object.entries(parts.epics).map(([epic, parts]) => (
                <div key={epic} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold text-white-50">{epic}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light epic-toggle-btn"
                      onClick={() => toggleEpic(epic)}
                    >
                      {epicAtRecommended(epic) ? "Remove" : "Insert"}
                    </button>
                  </div>
                  <ul className="list-group list-group-flush">
                    {parts.map(part => (
                      <li key={part.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{part.name}</div>
                          <div className="small text-white-50">
                            Recommended: {part.quantity} • Available: {part.available} • ID: {part.id}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="input-group input-group-sm" style={{ width: "200px" }}>
                            {/* <button className="btn btn-outline-primary" type="button" onclick="decQty('{{ p.id }}')">-</button> */}
                            {/* <input type="number" min="0" step="1" className="form-control gh-input text-center text-white" value="0" onChange={updateQuantity(part.id)} /> */}
                            {/* <button className="btn btn-outline-primary" type="button" onclick="incQty('{{ p.id }}')">+</button> */}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </> : (
              <ul className="list-group list-group-flush">
                <li className="list-group-item">No parts.</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card gh-box" id="assignCard" style={{ display: "none" }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="m-0">Assign Parts to Plates</h6>
            <div className="d-flex gap-2">
              {/* <button type="button" className="btn btn-sm btn-outline-danger" onclick="unassignAll()">Unassign All</button> */}
            </div>
          </div>
          <div className="row g-3" id="assignRow">
            <div className="col-lg-4">
              <div className="gh-box p-2">
                <div className="small text-white-50 mb-2">Unassigned</div>
                <ul id="assign-unassigned" className="list-group list-group-flush min-vh-25" style={{ minHeight: "220px" }}></ul>
              </div>
            </div>
            <div className="col-lg-8" id="assignPlates"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
}
