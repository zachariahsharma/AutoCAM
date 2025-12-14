export default function Dashboard() {
    return <div className="row">
        <div className="col-md-3">
            <div className="card gh-box gh-card-hover mb-3">
                <div className="card-body">
                    <h5 className="text-white">Material · Thickness</h5>
                    <ul className="list-group list-group-flush">
                        {/* {% for c in combos %}
                        <li className="list-group-item d-flex align-items-center justify-content-between text-white">
                            <div>
                                <div className="fw-bold text-white">{{ c.Material }}</div>
                                <div className="small text-white-50">Thickness: {{ c.ThicknessDisplay }} • Parts: {{ c.PartsCount }}</div>
                            </div>
                            <a className="btn btn-sm btn-primary" href="{{ url_for('main.material_thickness', material_enc=c.MaterialEsc, thickness_enc=c.ThicknessEsc) }}">Open</a>
                        </li>
                        {% else %}
                        <li className="list-group-item text-white-50">No materials found.</li>
                        {% endfor %} */}
                    </ul>
                </div>
            </div>
        </div>
        <div className="col-md-9">
            <div className="card gh-box gh-card-hover">
                <div className="card-body">
                    <h5 className="text-white">Recently Added Parts</h5>
                    <ul className="list-group list-group-flush">
                        {/* {% for p in recent_parts %}
                        <li className="list-group-item d-flex justify-content-between align-items-center text-white">
                            <span className="text-white">{{ p.name }} ({{ p.id }}) — Qty: {{ p.quantity }}</span>
                        </li>
                        {% else %}
                        <li className="list-group-item text-white-50">No recent parts.</li>
                        {% endfor %} */}
                    </ul>
                </div>
            </div>
        </div>

    </div>
}