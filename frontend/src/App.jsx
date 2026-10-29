            </div>

            <NavLink
              to="/reports"
              className="link"
            >
              View all →
            </NavLink>

          </div>

          <RecentReports />

        </section>

        <section className="card">

          <div className="card-head">

            <div>
              <h3>How it works</h3>
              <p>From report to action</p>
            </div>

          </div>

          <div className="steps">

            {[
              "Upload photo & location",
              "AI checks visible damage",
              "Authority inspects",
              "Repair & verify"
            ].map((x, i) => (
              <div
                className="step"
                key={x}
              >
                <b>{i + 1}</b>
                <span>{x}</span>
              </div>
            ))}

          </div>

        </section>

      </div>

      <div className="info-banner">

        <b>Important:</b> AI only evaluates visible
        evidence. Paint, plaster, blur or obstruction can
        hide damage. Low-confidence cases are routed for
        professional inspection.

      </div>
    </>
  );
}

function RecentReports() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api("/reports")
      .then(x => setItems(x.slice(0, 5)))
      .catch(() => {});
  }, []);

  return items.length ? (
    <div className="table-wrap">

      <table>

        <thead>
          <tr>
            <th>Report</th>
            <th>Issue</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {items.map(r => (
            <tr key={r.id}>

              <td>
                <NavLink
                  className="link"
                  to={`/reports/${r.id}`}
                >
                  {r.code}
                </NavLink>
              </td>

              <td>{r.damage_type}</td>

              <td>
                <Badge
                  tone={
                    r.severity === "High"
                      ? "danger"
                      : r.severity === "Medium"
                      ? "warning"
                      : "success"
                  }
                >
                  {r.severity}
                </Badge>
              </td>

              <td>{r.status}</td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  ) : (
    <Empty text="No reports yet. Create your first report." />
  );
}

function ReportDamage() {

  const nav = useNavigate();

  const [form, setForm] = useState({
    damage_type: "Wall Crack",
    description: "",
    latitude: "16.5062",
    longitude: "80.6480",
    address: "MG Road, Vijayawada"
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function handleFile(e) {

    const selected = e.target.files[0];

    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setMsg(
        "Please upload a valid building image."
      );
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setMsg(
        "Image must be smaller than 10 MB."
      );
      return;
    }

    const image = new Image();
    const imageURL =
      URL.createObjectURL(selected);

    image.onload = () => {

      URL.revokeObjectURL(imageURL);

      if (
        image.width < 640 ||
        image.height < 480
      ) {
        setMsg(
          "Image resolution is too low. Please upload a clearer image."
        );
        return;
      }

      setFile(selected);
      setPreview(
        URL.createObjectURL(selected)
      );
      setMsg("");

    };
