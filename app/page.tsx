import { Imported, Task } from "@/lib/db"

export default async function Dashboard() {
    const combos = await Task.aggregate([
        {
            $group: {
                _id: {
                    Material: "$Material",
                    Thickness: "$Thickness",
                },
                partsCount: {
                    $sum: {
                        $size: "$Parts"
                    }
                }
            }
        },
        {
            $project: {
                Material: "$_id.Material",
                Thickness: "$_id.Thickness",
                PartsCount: "$partsCount",
            }
        }
    ])
    // # Recently added parts from imported collection (sorted by newest ObjectId)
    const imported = await Imported.find().sort({ _id: "desc" }).limit(10)

    return <div className="row">
        <div className="col-md-3">
            <div className="card gh-box gh-card-hover mb-3">
                <div className="card-body">
                    <h5 className="text-white">Material · Thickness</h5>
                    <ul className="list-group list-group-flush">
                        {combos.length > 0 ? combos.map(combo => (
                            <li key={combo.Material + combo.Thickness} className="list-group-item d-flex align-items-center justify-content-between text-white">
                                <div>
                                    <div className="fw-bold text-white">{combo.Material}</div>
                                    <div className="small text-white-50">Thickness: {combo.Thickness} • Parts: {combo.PartsCount}</div>
                                </div>
                                <a className="btn btn-sm btn-primary" href={`/mt/${encodeURIComponent(combo.Material)}/${encodeURIComponent(combo.Thickness)}`}>Open</a>
                            </li>
                        )) : (
                            <li className="list-group-item text-white-50">No materials found.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
        <div className="col-md-9">
            <div className="card gh-box gh-card-hover">
                <div className="card-body">
                    <h5 className="text-white">Recently Added Parts</h5>
                    <ul className="list-group list-group-flush">
                        {imported.length > 0 ? imported.map(imp => (
                            <li key={imp.id} className="list-group-item d-flex justify-content-between align-items-center text-white">
                                <span className="text-white">{imp.name} ({imp.child}) — Qty: {imp.quantity}</span>
                            </li>
                        )) : (
                            <li className="list-group-item text-white-50">No materials found.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    </div>
}
