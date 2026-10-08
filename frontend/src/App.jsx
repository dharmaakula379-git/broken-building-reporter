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

    // Check file type
    if (!selected.type.startsWith("image/")) {
      setMsg("Please upload a valid building image.");
      return;
    }

    // Check file size
    if (selected.size > 10 * 1024 * 1024) {
      setMsg("Image must be smaller than 10 MB.");
      return;
    }

    // Check image resolution
    const image = new Image();
    const imageURL = URL.createObjectURL(selected);

    image.onload = () => {
      URL.revokeObjectURL(imageURL);

      if (image.width < 640 || image.height < 480) {
        setMsg(
          "Image resolution is too low. Please upload a clearer image."
        );
        return;
      }

      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setMsg("");
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageURL);
      setMsg("Unable to read this image. Please upload another image.");
    };

    image.src = imageURL;
  }

  async function submit(e) {
    e.preventDefault();

    if (!file) {
      setMsg("Please upload a building image first.");
      return;
    }

    if (!form.description.trim()) {
      setMsg("Please describe the visible problem.");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const body = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      };

      // Create report
      const r = await api("/reports", {
        method: "POST",
        body: JSON.stringify(body)
      });

      // Upload image
      const fd = new FormData();
      fd.append("file", file);

      await fetch(`${API}/reports/${r.id}/image`, {
        method: "POST",
        body: fd
      });

      // Run AI analysis
      await api(`/ai/analyze/${r.id}`, {
        method: "POST"
      });

      // Go to analysis page
      nav(`/analysis/${r.id}`);

    } catch (err) {
      setMsg(err.message || "Could not submit report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Report Building Damage</h2>
          <p>
            Upload clear evidence and provide the location and details
            of the visible building problem.
          </p>
        </div>
      </div>

      <form className="card form-card" onSubmit={submit}>

        {/* IMAGE UPLOAD */}
        <div
          className="upload"
          onClick={() => document.getElementById("photo").click()}
        >
          {preview ? (
            <div className="image-preview">
              <img
                src={preview}
                alt="Building defect preview"
              />

              <div className="file-name">
                ✓ {file.name}
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon">▧</div>

              <b>
                Capture or upload building photo
              </b>

              <span>
                JPG, PNG up to 10 MB
              </span>
            </>
          )}

          <input
            id="photo"
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
        </div>

        {/* FORM FIELDS */}
        <div className="form-grid">

          <label>
            Damage type

            <select
              value={form.damage_type}
              onChange={e =>
                setForm({
                  ...form,
                  damage_type: e.target.value
                })
              }
            >
              {[
                "Wall Crack",
                "Structural Crack",
                "Damaged Plaster",
                "Water Leakage",
                "Damaged Balcony",
                "Damaged Roof",
                "Exposed Wiring",
                "Broken Windows",
                "Other Visible Hazard"
              ].map(x => (
                <option key={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>

          <label>
            Building address

            <input
              value={form.address}
              onChange={e =>
                setForm({
                  ...form,
                  address: e.target.value
                })
              }
            />
          </label>

          <label>
            Latitude

            <input
              value={form.latitude}
              onChange={e =>
                setForm({
                  ...form,
                  latitude: e.target.value
                })
              }
            />
          </label>

          <label>
            Longitude

            <input
              value={form.longitude}
              onChange={e =>
                setForm({
                  ...form,
                  longitude: e.target.value
                })
              }
            />
          </label>

          <label className="full">
            Description

            <textarea
              rows="5"
              placeholder="Describe what you can see..."
              value={form.description}
              onChange={e =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
            />
          </label>

        </div>

        {/* LOCATION */}
        <div className="location-box">
          ⌖

          <div>
            <b>
              Location captured
            </b>

            <span>
              {form.latitude}, {form.longitude}
            </span>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={() =>
              navigator.geolocation?.getCurrentPosition(
                p =>
                  setForm({
                    ...form,
                    latitude: p.coords.latitude.toFixed(6),
                    longitude: p.coords.longitude.toFixed(6)
                  }),

                () =>
                  setMsg(
                    "Unable to access your location. Please enter it manually."
                  )
              )
            }
          >
            Use my location
          </button>
        </div>

        {/* ERROR / MESSAGE */}
        {msg && (
          <div className="error">
            {msg}
          </div>
        )}

        {/* SUBMIT */}
        <button
          className="primary wide"
          disabled={busy}
        >
          {busy
            ? "Analyzing..."
            : "✦ Analyze & Submit Report"}
        </button>

      </form>
    </>
  );
}
