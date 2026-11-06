import React, { useEffect, useState, useRef } from "react";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

const icons = {
  home: "⌂",
  report: "＋",
  reports: "▤",
  map: "⌖",
  building: "▥",
  bell: "●",
  authority: "◆",
  analytics: "▥",
  repair: "✓",
  inspect: "◉",
  menu: "☰",
  close: "×"
};

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Stat({ label, value, tone = "" }) {
  return (
    <div className={`stat ${tone}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

function Layout({ role, setRole }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const citizenLinks = [
    ["/", "⌂", "Dashboard"],
    ["/report", "＋", "Report Damage"],
    ["/reports", "▤", "My Reports"],
    ["/map", "⌖", "Safety Map"],
    ["/buildings", "▥", "Building Profiles"],
    ["/notifications", "●", "Notifications"]
  ];

  const authorityLinks = [
    ["/authority", "◆", "Authority Dashboard"],
    ["/authority/reports", "▤", "Report Management"],
    ["/authority/inspections", "◉", "Inspections"],
    ["/authority/escalations", "↑", "Escalations"],
    ["/authority/analytics", "▥", "Analytics"]
  ];

  const links =
    role === "authority" ? authorityLinks : citizenLinks;

  return (
    <div className="app-shell">

      <aside className={`sidebar ${open ? "show" : ""}`}>

        <div className="brand">
          <div className="brand-mark">⌂</div>

          <div>
            <strong>Broken Building</strong>
            <small>Reporter</small>
          </div>
        </div>

        <div className="role-pill">
          {role === "authority"
            ? "Authority Portal"
            : "Citizen Portal"}
        </div>

        <nav>
          {links.map(([to, ico, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive ? "nav active" : "nav"
              }
            >
              <span>{ico}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="safety-note">
            <b>Safety first</b>
            <span>
              AI assists reporting; professionals make final
              structural decisions.
            </span>
          </div>

          <button
            className="ghost"
            onClick={() =>
              setRole(
                role === "citizen"
                  ? "authority"
                  : "citizen"
              )
            }
          >
            Switch to{" "}
            {role === "citizen"
              ? "Authority"
              : "Citizen"}
          </button>

        </div>
      </aside>

      <div className="main">

        <header className="topbar">

          <button
            className="icon-btn mobile-only"
            onClick={() => setOpen(!open)}
          >
            {open ? icons.close : icons.menu}
          </button>

          <div className="crumb">
            {location.pathname === "/"
              ? "Dashboard"
              : location.pathname
                  .slice(1)
                  .replaceAll("-", " ")}
          </div>

          <div className="top-actions">

            <button
              className="role-switch"
              onClick={() =>
                setRole(
                  role === "citizen"
                    ? "authority"
                    : "citizen"
                )
              }
            >
              Viewing: <b>{role}</b> ↔
            </button>

            <NavLink
              to="/notifications"
              className="notification"
            >
              ●<span>3</span>
            </NavLink>

            <div className="avatar">
              {role === "authority" ? "A" : "C"}
            </div>

          </div>
        </header>

        <main className="content">

          <Routes>

            <Route
              path="/"
              element={<CitizenDashboard />}
            />

            <Route
              path="/report"
              element={<ReportDamage />}
            />

            <Route
              path="/analysis/:id"
              element={<Analysis />}
            />

            <Route
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="/reports/:id"
              element={<ReportDetails />}
            />

            <Route
              path="/map"
              element={<SafetyMap />}
            />

            <Route
              path="/buildings"
              element={<Buildings />}
            />

            <Route
              path="/buildings/:id"
              element={<BuildingProfile />}
            />

            <Route
              path="/repair/:id"
              element={<RepairVerification />}
            />

            <Route
              path="/notifications"
              element={<Notifications />}
            />

            <Route
              path="/authority"
              element={<AuthorityDashboard />}
            />

            <Route
              path="/authority/reports"
              element={<AuthorityReports />}
            />

            <Route
              path="/authority/inspections"
              element={<Inspections />}
            />

            <Route
              path="/authority/escalations"
              element={<Escalations />}
            />

            <Route
              path="/authority/analytics"
              element={<Analytics />}
            />

            <Route
              path="*"
              element={<CitizenDashboard />}
            />

          </Routes>

        </main>
      </div>
    </div>
  );
}

function Hero() {
  const nav = useNavigate();

  return (
    <section className="hero">

      <div>

        <div className="eyebrow">
          AI-ASSISTED CIVIC SAFETY
        </div>

        <h1>
          Report. <span>Track.</span> Resolve.
        </h1>

        <p>
          Report visible building damage, get AI-assisted
          analysis, and keep every issue accountable from
          first report to final verification.
        </p>

        <div className="hero-actions">

          <button
            className="primary"
            onClick={() => nav("/report")}
          >
            ＋ Report Building Damage
          </button>

          <button
            className="secondary"
            onClick={() => nav("/map")}
          >
            ⌖ View Safety Map
          </button>

        </div>

      </div>

      <div className="hero-card">

        <div className="hero-building">
          🏢
        </div>

        <div>
          <b>Safety intelligence</b>
          <span>
            Photo → AI → Inspection → Resolution
          </span>
        </div>

      </div>

    </section>
  );
}

function CitizenDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/dashboard")
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <>
      <Hero />

      <div className="page-head">

        <div>
          <h2>Citizen Dashboard</h2>
          <p>
            Monitor your submitted building safety reports.
          </p>
        </div>

        <NavLink
          className="primary small"
          to="/report"
        >
          ＋ New Report
        </NavLink>

      </div>

      <div className="stats-grid">

        <Stat
          label="Total Reports"
          value={data?.total ?? 12}
        />

        <Stat
          label="High Priority"
          value={data?.high_priority ?? 3}
          tone="danger"
        />

        <Stat
          label="Under Inspection"
          value={data?.under_inspection ?? 4}
          tone="warning"
        />

        <Stat
          label="Resolved"
          value={data?.resolved ?? 5}
          tone="success"
        />

      </div>

      <div className="grid-2">

        <section className="card">

          <div className="card-head">

            <div>
              <h3>Recent Reports</h3>
              <p>Your latest building issues</p>
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

function compressImageForUpload(file, maxDimension = 1280, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/") || file.size < 400 * 1024) {
      return resolve(file);
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        return resolve(file);
      }
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            return resolve(file);
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now()
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

const geocodeCache = new Map();

async function fetchGeocode(query, signal) {
  const normKey = query.trim().toLowerCase();
  if (geocodeCache.has(normKey)) {
    return geocodeCache.get(normKey);
  }

  // All geocoding requests route strictly through the backend proxy.
  // Respects backend rate limiting, server-side caching, and User-Agent policy.
  try {
    const res = await fetch(`${API}/geocode?q=${encodeURIComponent(query)}`, {
      signal,
      headers: { Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      geocodeCache.set(normKey, data);
      return data;
    } else {
      return {
        found: false,
        error: "Geocoding service unavailable. You can enter coordinates manually below.",
        address: query
      };
    }
  } catch (err) {
    if (err.name === "AbortError") throw err;
    return {
      found: false,
      error: "Unable to connect to geocoding server. You can enter coordinates manually below.",
      address: query
    };
  }
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
  const isSubmittingRef = useRef(false);
  const [stepMsg, setStepMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // Address geocoding states
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState({
    type: "idle",
    message: ""
  });
  const lastGeocodedAddressRef = useRef("MG Road, Vijayawada");
  const manualCoordsRef = useRef(false);
  const geocodeAbortRef = useRef(null);
  const latestAddressRef = useRef("MG Road, Vijayawada");

  // Keep latestAddressRef in sync with current address
  useEffect(() => {
    latestAddressRef.current = form.address.trim();
  }, [form.address]);

  // Debounced address geocoding effect (800ms debounce)
  useEffect(() => {
    const query = form.address.trim();

    if (query.length < 3) {
      if (geocodeAbortRef.current) {
        geocodeAbortRef.current.abort();
        geocodeAbortRef.current = null;
      }
      setGeoLoading(false);
      if (query.length === 0) {
        setGeoStatus({ type: "idle", message: "" });
      } else {
        setGeoStatus({
          type: "info",
          message: "Enter at least 3 characters to search coordinates."
        });
      }
      return;
    }

    if (
      query === lastGeocodedAddressRef.current &&
      !manualCoordsRef.current
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      // Abort any prior in-flight request before creating a new one
      if (geocodeAbortRef.current) {
        geocodeAbortRef.current.abort();
      }
      const controller = new AbortController();
      geocodeAbortRef.current = controller;

      setGeoLoading(true);
      setGeoStatus({
        type: "loading",
        message: "Searching coordinates for address..."
      });

      try {
        const result = await fetchGeocode(query, controller.signal);

        // Strict guard: verify this request was NOT aborted AND still matches the latest entered address
        if (controller.signal.aborted || latestAddressRef.current !== query) {
          return;
        }

        if (result.found) {
          setForm(prev => {
            if (prev.address.trim() === query) {
              return {
                ...prev,
                latitude: String(result.latitude),
                longitude: String(result.longitude)
              };
            }
            return prev;
          });
          lastGeocodedAddressRef.current = query;
          manualCoordsRef.current = false;
          const shortName = result.display_name
            ? (result.display_name.length > 55
                ? result.display_name.slice(0, 52) + "..."
                : result.display_name)
            : `${result.latitude}, ${result.longitude}`;
          setGeoStatus({
            type: "success",
            message: `Coordinates located: ${shortName}`
          });
        } else {
          setGeoStatus({
            type: "error",
            message:
              result.message ||
              result.error ||
              "Could not find coordinates for this address. Please verify or enter manually."
          });
        }
      } catch (err) {
        if (err.name !== "AbortError" && latestAddressRef.current === query) {
          setGeoStatus({
            type: "error",
            message: "Unable to contact geocoding service. Please enter coordinates manually."
          });
        }
      } finally {
        if (!controller.signal.aborted && latestAddressRef.current === query) {
          setGeoLoading(false);
        }
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      if (geocodeAbortRef.current) {
        geocodeAbortRef.current.abort();
      }
    };
  }, [form.address]);

  useEffect(() => {
    let timer;
    if (busy) {
      setElapsed(0);
      timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [busy]);

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

    image.onerror = () => {

      URL.revokeObjectURL(imageURL);

      setMsg(
        "Unable to read this image. Please upload another image."
      );

    };

    image.src = imageURL;
  }

  async function submit(e) {

    e.preventDefault();

    if (isSubmittingRef.current || busy) {
      return;
    }

    if (!file) {
      setMsg(
        "Please upload a building image first."
      );
      return;
    }

    if (!form.description.trim()) {
      setMsg(
        "Please describe the visible problem."
      );
      return;
    }

    if (!form.address.trim()) {
      setMsg(
        "Please enter the building address."
      );
      return;
    }

    if (geoLoading) {
      setMsg(
        "Address lookup is currently in progress. Please wait for coordinates to update."
      );
      return;
    }

    const currentAddr = form.address.trim();
    const addressChanged = currentAddr !== lastGeocodedAddressRef.current;
    if (addressChanged && !manualCoordsRef.current) {
      setMsg(
        "Coordinates do not match the entered address. Please wait for lookup or enter coordinates manually."
      );
      return;
    }

    const latVal = Number(form.latitude);
    const lonVal = Number(form.longitude);
    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      setMsg(
        "Please provide a valid latitude between -90 and 90."
      );
      return;
    }
    if (isNaN(lonVal) || lonVal < -180 || lonVal > 180) {
      setMsg(
        "Please provide a valid longitude between -180 and 180."
      );
      return;
    }

    isSubmittingRef.current = true;
    setBusy(true);
    setMsg("");
    setStepMsg("Optimizing image and creating report...");

    try {

      const body = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      };

      const r = await api("/reports", {
        method: "POST",
        body: JSON.stringify(body)
      });

      setStepMsg("Uploading photo...");
      const fileToUpload = await compressImageForUpload(file);
      const fd = new FormData();
      fd.append("file", fileToUpload);

      const imageResponse = await fetch(
  `${API}/reports/${r.id}/image`,
  {
    method: "POST",
    body: fd
  }
);

if (!imageResponse.ok) {
  const errorText = await imageResponse.text();
  throw new Error(
    `Image upload failed (${imageResponse.status}): ${errorText}`
  );
}

      setStepMsg("Running AI damage detection (typically 20–45s)...");
      await api(
        `/ai/analyze/${r.id}`,
        {
          method: "POST"
        }
      );

      nav(`/analysis/${r.id}`);

    } catch (err) {

      setMsg(
        err.message ||
        "Could not submit report."
      );

    } finally {

      setBusy(false);
      isSubmittingRef.current = false;
      setStepMsg("");

    }
  }

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Report Building Damage
          </h2>

          <p>
            Upload clear evidence and provide the
            location and details of the visible
            building problem.
          </p>

        </div>

      </div>

      <form
        className="card form-card"
        onSubmit={submit}
      >

        <div
          className="upload"
          onClick={() =>
            document
              .getElementById("photo")
              .click()
          }
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
              <div className="upload-icon">
                ▧
              </div>

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
              placeholder="e.g. MG Road, Vijayawada"
              onChange={e => {
                setForm({
                  ...form,
                  address: e.target.value
                });
                manualCoordsRef.current = false;
              }}
            />

            {geoStatus.message && (
              <div className={`geo-status-box ${geoStatus.type}`}>
                {geoLoading && <span className="geo-spinner" />}
                {geoStatus.type === "success" && "✓ "}
                {geoStatus.type === "error" && "⚠ "}
                {geoStatus.type === "info" && "ℹ "}
                <span>{geoStatus.message}</span>
              </div>
            )}

          </label>

          <label>
            Latitude

            <input
              value={form.latitude}
              onChange={e => {
                setForm({
                  ...form,
                  latitude: e.target.value
                });
                manualCoordsRef.current = true;
                setGeoStatus({
                  type: "info",
                  message: "Latitude edited manually."
                });
              }}
            />

          </label>

          <label>
            Longitude

            <input
              value={form.longitude}
              onChange={e => {
                setForm({
                  ...form,
                  longitude: e.target.value
                });
                manualCoordsRef.current = true;
                setGeoStatus({
                  type: "info",
                  message: "Longitude edited manually."
                });
              }}
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

        <div className="location-box">

          ⌖

          <div>

            <b>
              Location captured
            </b>

            <span>
              {geoLoading
                ? "Locating address coordinates..."
                : `${form.latitude}, ${form.longitude}${
                    geoStatus.type === "success"
                      ? " (auto-located)"
                      : manualCoordsRef.current
                      ? " (manual override)"
                      : ""
                  }`}
            </span>

          </div>

          <button
            type="button"
            className="secondary"
            onClick={() =>
              navigator.geolocation?.getCurrentPosition(
                p => {
                  const latStr = p.coords.latitude.toFixed(6);
                  const lonStr = p.coords.longitude.toFixed(6);
                  setForm(prev => ({
                    ...prev,
                    latitude: latStr,
                    longitude: lonStr
                  }));
                  manualCoordsRef.current = true;
                  lastGeocodedAddressRef.current = form.address.trim();
                  setGeoStatus({
                    type: "info",
                    message: "Device GPS location applied."
                  });
                },
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

        {msg && (
          <div className="error">
            {msg}
          </div>
        )}

        <button
          className="primary wide"
          disabled={busy}
        >
          {busy
            ? (stepMsg ? `${stepMsg} (${elapsed}s)` : `Analyzing... (${elapsed}s)`)
            : "✦ Analyze & Submit Report"}
        </button>

      </form>
    </>
  );
}

function Analysis() {

  const { id } = useParamsSafe();
  const nav = useNavigate();
  const [r, setR] = useState(null);

  useEffect(() => {

    api(`/reports/${id}`)
      .then(setR)
      .catch(() => {});

  }, [id]);

  if (!r) {
    return <Loading />;
  }

  const confidence =
    Number(r.confidence || 0);

  const low = confidence < 70;

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            AI Analysis Result
          </h2>

          <p>
            AI-assisted assessment of the
            visible building evidence.
          </p>

        </div>

      </div>

      <div className="analysis-grid">

        <section className="card">

          <div className="analysis-title">

            <div>

              <span>
                Visible defect detected
              </span>

              <h1>
                {r.damage_type ||
                  "Unknown Defect"}
              </h1>

            </div>

            <Badge
              tone={
                r.severity === "High"
                  ? "danger"
                  : r.severity === "Medium"
                  ? "warning"
                  : "success"
              }
            >
              {r.severity || "Unknown"}
            </Badge>

          </div>

          <div className="metrics">

            <div>
              <span>AI Confidence</span>
              <b>{confidence}%</b>
            </div>

            <div>
              <span>Severity</span>
              <b>
                {r.severity || "Unknown"}
              </b>
            </div>

            <div>
              <span>Priority Score</span>
              <b>
                {r.priority_score ?? 0}/100
              </b>
            </div>

          </div>

   
<div className="scan-box">

  {r.image_path ? (
    <img
      src={
        r.image_path.startsWith("http")
          ? r.image_path
          : `https://broken-building-reporter-api.onrender.com/${r.image_path.replace(/^\/+/, "")}`
      }
      alt="Uploaded building damage"
      style={{
        width: "100%",
        height: "100%",
        maxHeight: "320px",
        objectFit: "contain",
        borderRadius: "12px"
      }}
      onError={(e) => {
        e.currentTarget.alt = "Uploaded image could not be loaded";
      }}
    />
  ) : (
    <p>Uploaded image not available.</p>
  )}

  <span>
    AI analyzed the uploaded evidence
  </span>

</div>
       

          {low ? (

            <div className="warning-box">

              <b>
                ⚠ Inspection Required
              </b>

              <span>
                AI confidence is low. Blur, poor
                lighting, paint, plaster or
                obstruction may hide visible damage.
                A clearer image or professional
                inspection is recommended.
              </span>

            </div>

          ) : (

            <div className="recommendation">

              <b>
                ✓ AI Screening Completed
              </b>

              <span>
                The system found visible evidence
                matching the reported building defect.
                Professional inspection is recommended
                for final safety decisions.
              </span>

            </div>

          )}

          <div
            className="card"
            style={{ marginTop: "20px" }}
          >

            <h3>
              Recommended Action
            </h3>

            <p>
              {r.recommendation ||
                "Have the reported defect reviewed by a qualified professional."}
            </p>

          </div>

          <div
            className="card"
            style={{ marginTop: "20px" }}
          >

            <h3>
              Report Information
            </h3>

            <div className="detail-grid">

              <div>
                <span>Report ID</span>
                <b>
                  {r.code || r.id}
                </b>
              </div>

              <div>
                <span>Damage Type</span>
                <b>
                  {r.damage_type}
                </b>
              </div>

              <div>
                <span>Address</span>
                <b>
                  {r.address}
                </b>
              </div>

              <div>
                <span>Coordinates</span>
                <b>
                  {r.latitude}, {r.longitude}
                </b>
              </div>

            </div>

          </div>

          <div
            className="info-banner"
            style={{ marginTop: "20px" }}
          >

            <b>Important:</b> AI only evaluates
            visible evidence. It does not determine
            the final structural safety of a building.
            Qualified professionals should make the
            final safety decision.

          </div>

          <div className="button-row">

            <button
              className="secondary"
              onClick={() => nav("/report")}
            >
              Analyze Another
            </button>

            <button
              className="primary"
              onClick={() =>
                nav(`/reports/${id}`)
              }
            >
              View Full Report →
            </button>

          </div>

        </section>

      </div>
    </>
  );
}

function useParamsSafe() {

  const location = useLocation();

  return {
    id: location.pathname
      .split("/")
      .pop()
  };
}

function Loading() {
  return (
    <div className="loading">
      Loading…
    </div>
  );
}

function Reports() {

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {

    api("/reports")
      .then(setItems)
      .catch(() => {});

  }, []);

  const filtered = items.filter(r =>
    (
      r.code +
      r.damage_type +
      r.status
    )
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            My Reports
          </h2>

          <p>
            Track every issue from report to resolution.
          </p>

        </div>

        <NavLink
          className="primary small"
          to="/report"
        >
          ＋ New Report
        </NavLink>

      </div>

      <div className="card">

        <div className="toolbar">

          <input
            placeholder="Search reports…"
            value={q}
            onChange={e =>
              setQ(e.target.value)
            }
          />

          <div className="filter-pills">
            <span>All</span>
            <span>High</span>
            <span>Under Inspection</span>
            <span>Resolved</span>
          </div>

        </div>

        <div className="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Report ID</th>
                <th>Issue</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Status</th>
                <th></th>
              </tr>

            </thead>

            <tbody>

              {filtered.map(r => (

                <tr key={r.id}>

                  <td>
                    <b>{r.code}</b>
                  </td>

                  <td>
                    {r.damage_type}
                  </td>

                  <td>
                    {r.address}
                  </td>

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

                  <td>
                    {r.status}
                  </td>

                  <td>

                    <NavLink
                      className="link"
                      to={`/reports/${r.id}`}
                    >
                      View →
                    </NavLink>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}

function ReportDetails() {

  const { id } = useParamsSafe();

  const [r, setR] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {

    api(`/reports/${id}`)
      .then(setR)
      .catch(() => {});

  }, [id]);

  async function update(status) {

    setBusy(true);

    try {

      await api(
        `/reports/${id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status })
        }
      );

      setR(
        await api(`/reports/${id}`)
      );

    } finally {

      setBusy(false);

    }
  }

  if (!r) {
    return <Loading />;
  }

  const stages = [
    "Reported",
    "AI Verified",
    "Assigned",
    "Under Inspection",
    "Repair Pending",
    "Resolved"
  ];

  const current =
    stages.indexOf(r.status);

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Report Details
          </h2>

          <p>
            {r.code} • {r.address}
          </p>

        </div>

        <Badge
          tone={
            r.severity === "High"
              ? "danger"
              : "warning"
          }
        >
          {r.severity} priority
        </Badge>

      </div>

      <div className="grid-2">

        <section className="card">

          <div className="report-visual">
  {r.image_path ? (
    <img
      src={
        r.image_path.startsWith("http://") ||
        r.image_path.startsWith("https://")
          ? r.image_path
          : `https://broken-building-reporter-api.onrender.com${r.image_path}`
      }
      alt="Uploaded building damage"
      style={{
        width: "100%",
        maxHeight: "320px",
        objectFit: "contain",
        borderRadius: "12px"
      }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <div className="fake-building">
      🏢
    </div>
  )}

  <div>
    <b>{r.damage_type}</b>
    <span>
      {r.description ||
        "Visible building damage reported by citizen."}
    </span>
  </div>
</div>


          <div className="detail-grid">

            <div>
              <span>Confidence</span>
              <b>{r.confidence}%</b>
            </div>

            <div>
              <span>Priority score</span>
              <b>
                {r.priority_score}/100
              </b>
            </div>

            <div>
              <span>Reported</span>
              <b>
                {new Date(
                  r.created_at
                ).toLocaleString()}
              </b>
            </div>

            <div>
              <span>Coordinates</span>
              <b>
                {r.latitude}, {r.longitude}
              </b>
            </div>

          </div>

        </section>

        <section className="card">

          <h3>
            Status timeline
          </h3>

          <div className="timeline">

            {stages.map((s, i) => (

              <div
                className={`timeline-item ${
                  i <= current ? "done" : ""
                }`}
                key={s}
              >

                <i>
                  {i <= current ? "✓" : ""}
                </i>

                <div>

                  <b>{s}</b>

                  {i === current && (
                    <span>
                      Current status
                    </span>
                  )}

                </div>

              </div>

            ))}

          </div>

          <div className="button-row">

            <button
              disabled={busy}
              className="secondary"
              onClick={() =>
                update("Under Inspection")
              }
            >
              Request inspection
            </button>

            <button
              disabled={busy}
              className="primary"
              onClick={() =>
                update("Resolved")
              }
            >
              Mark resolved
            </button>

          </div>

        </section>

      </div>
    </>
  );
}

function SafetyMap() {

  const [items, setItems] = useState([]);

  useEffect(() => {

    api("/reports")
      .then(setItems)
      .catch(() => {});

  }, []);

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Safety Map
          </h2>

          <p>
            Risk locations and reported building issues.
          </p>

        </div>

      </div>

      <div className="card map-card">

        <div className="map-placeholder">

          <div className="map-grid">

            {items.map((r, i) => (

              <div
                key={r.id}
                className={`pin p${i % 8}`}
                title={r.code}
              >
                {r.severity === "High"
                  ? "🔴"
                  : r.severity === "Medium"
                  ? "🟠"
                  : "🟢"}
              </div>

            ))}

          </div>

          <div className="map-center">
            Vijayawada • Safety Risk View
          </div>

        </div>

        <div className="legend">
          <span>🔴 High priority</span>
          <span>🟠 Medium priority</span>
          <span>🟢 Low priority</span>
        </div>

      </div>
    </>
  );
}

function Buildings() {

  const [items, setItems] =
    useState([]);

  useEffect(() => {

    api("/buildings")
      .then(setItems)
      .catch(() => {});

  }, []);

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Building Profiles
          </h2>

          <p>
            Historical reports and visible damage trends.
          </p>

        </div>

      </div>

      <div className="building-grid">

        {items.map(b => (

          <NavLink
            className="building-card"
            to={`/buildings/${b.id}`}
            key={b.id}
          >

            <div className="building-art">
              🏢
            </div>

            <div>

              <b>
                {b.building_code}
              </b>

              <span>
                {b.address}
              </span>

              <Badge
                tone={
                  b.risk === "High"
                    ? "danger"
                    : b.risk === "Medium"
                    ? "warning"
                    : "success"
                }
              >
                {b.risk} attention
              </Badge>

            </div>

          </NavLink>

        ))}

      </div>
    </>
  );
}

function BuildingProfile() {

  const { id } = useParamsSafe();

  const [b, setB] =
    useState(null);

  useEffect(() => {

    api(`/buildings/${id}`)
      .then(setB)
      .catch(() => {});

  }, [id]);

  if (!b) {
    return <Loading />;
  }

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            {b.building_code}
          </h2>

          <p>
            {b.address}
          </p>

        </div>

        <Badge
          tone={
            b.risk === "High"
              ? "danger"
              : "warning"
          }
        >
          {b.risk}
        </Badge>

      </div>

      <div className="grid-2">

        <section className="card">

          <h3>
            Building Profile
          </h3>

          <div className="building-large">
            🏢
          </div>

          <div className="detail-grid">

            <div>
              <span>Total reports</span>
              <b>{b.total_reports}</b>
            </div>

            <div>
              <span>High priority</span>
              <b>{b.high_priority}</b>
            </div>

            <div>
              <span>Resolved</span>
              <b>{b.resolved}</b>
            </div>

            <div>
              <span>Trend</span>
              <b>{b.trend}</b>
            </div>

          </div>

        </section>

        <section className="card">

          <h3>
            Damage History
          </h3>

          <div className="history">

            {b.history.map((h, i) => (

              <div
                className="history-row"
                key={i}
              >

                <div
                  className={`history-dot ${h.severity.toLowerCase()}`}
                />

                <div>

                  <b>
                    {h.date} • {h.damage_type}
                  </b>

                  <span>
                    {h.note}
                  </span>

                </div>

                <Badge
                  tone={
                    h.severity === "High"
                      ? "danger"
                      : h.severity === "Medium"
                      ? "warning"
                      : "success"
                  }
                >
                  {h.severity}
                </Badge>

              </div>

            ))}

          </div>

        </section>

      </div>
    </>
  );
}

function RepairVerification() {

  const [done, setDone] =
    useState(false);

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Repair Verification
          </h2>

          <p>
            Compare evidence before and after repair.
          </p>

        </div>

      </div>

      <section className="card">

        <div className="compare">

          <div>

            <h4>
              Before Repair
            </h4>

            <div className="fake-wall crack-wall">
              ╱╲╱╲
            </div>

          </div>

          <div>

            <h4>
              After Repair
            </h4>

            <div className="fake-wall">
              Clean surface
            </div>

          </div>

        </div>

        <div className="success-box">

          <b>
            {done
              ? "✓ Verification submitted"
              : "✓ Damage appears reduced"}
          </b>

          <span>
            AI comparison is an assistance tool;
            final verification should be performed
            by an authorized professional.
          </span>

        </div>

        <button
          className="primary"
          onClick={() => setDone(true)}
        >
          {done
            ? "Submitted"
            : "Submit Verification"}
        </button>

      </section>
    </>
  );
}

function Notifications() {

  const notes = [
    [
      "New high priority report received",
      "Building B-1048 • Wall crack",
      "danger"
    ],
    [
      "Inspection scheduled",
      "B-1048 • Tomorrow 09:00",
      "info"
    ],
    [
      "Repair update submitted",
      "B-1022 • Verification pending",
      "warning"
    ],
    [
      "Repair verification successful",
      "B-0987 • Resolved",
      "success"
    ]
  ];

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Notifications
          </h2>

          <p>
            Important updates about your reports.
          </p>

        </div>

      </div>

      <div className="notification-list">

        {notes.map((n, i) => (

          <div
            className="notification-card"
            key={i}
          >

            <div
              className={`note-icon ${n[2]}`}
            >
              {i + 1}
            </div>

            <div>

              <b>{n[0]}</b>

              <span>{n[1]}</span>

            </div>

            <small>
              Today
            </small>

          </div>

        ))}

      </div>
    </>
  );
}

function AuthorityDashboard() {

  const [d, setD] =
    useState(null);

  useEffect(() => {

    api("/dashboard")
      .then(setD)
      .catch(() => {});

  }, []);

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Authority Dashboard
          </h2>

          <p>
            Prioritize, inspect and resolve building
            safety reports.
          </p>

        </div>

        <NavLink
          className="secondary"
          to="/authority/reports"
        >
          Manage Reports →
        </NavLink>

      </div>

      <div className="stats-grid">

        <Stat
          label="Total Reports"
          value={d?.total ?? 128}
        />

        <Stat
          label="High Priority"
          value={d?.high_priority ?? 17}
          tone="danger"
        />

        <Stat
          label="Under Inspection"
          value={d?.under_inspection ?? 23}
          tone="warning"
        />

        <Stat
          label="Resolved"
          value={d?.resolved ?? 88}
          tone="success"
        />

      </div>

      <div className="grid-2">

        <section className="card">

          <div className="card-head">

            <div>

              <h3>
                Recent high-priority reports
              </h3>

              <p>
                Cases needing attention
              </p>

            </div>

          </div>

          <RecentReports />

        </section>

        <section className="card">

          <h3>
            Department assignment
          </h3>

          <div className="bars">

            {[
              ["Building Safety Dept.", 23],
              ["Engineering Dept.", 18],
              ["Town Planning Dept.", 17],
              ["Electrical Dept.", 11]
            ].map(x => (

              <div
                className="bar-row"
                key={x[0]}
              >

                <span>{x[0]}</span>

                <b>{x[1]}</b>

                <div>
                  <i
                    style={{
                      width: `${x[1] * 3}%`
                    }}
                  />
                </div>

              </div>

            ))}

          </div>

        </section>

      </div>
    </>
  );
}

function AuthorityReports() {

  const [items, setItems] =
    useState([]);

  useEffect(() => {

    api("/reports")
      .then(setItems)
      .catch(() => {});

  }, []);

  async function act(id, status) {

    await api(
      `/reports/${id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status })
      }
    );

    setItems(
      await api("/reports")
    );
  }

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Report Management
          </h2>

          <p>
            Verify, assign and update building reports.
          </p>

        </div>

      </div>

      <div className="card">

        <div className="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Report</th>
                <th>Issue</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {items.map(r => (

                <tr key={r.id}>

                  <td>
                    <b>{r.code}</b>
                  </td>

                  <td>
                    {r.damage_type}
                    <br />
                    <small>
                      {r.address}
                    </small>
                  </td>

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

                  <td>
                    {r.status}
                  </td>

                  <td>

                    <button
                      className="mini"
                      onClick={() =>
                        act(
                          r.id,
                          "Under Inspection"
                        )
                      }
                    >
                      Inspect
                    </button>

                    <button
                      className="mini"
                      onClick={() =>
                        act(
                          r.id,
                          "Resolved"
                        )
                      }
                    >
                      Resolve
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}

function Inspections() {

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Inspections
          </h2>

          <p>
            Human verification queue for reported damage.
          </p>

        </div>

      </div>

      <div className="card">

        <div className="inspection">

          <b>R-2026-1048</b>

          <span>
            Wall Crack • High • MG Road
          </span>

          <Badge tone="danger">
            Inspection Required
          </Badge>

          <button className="mini">
            Schedule
          </button>

        </div>

        <div className="inspection">

          <b>R-2026-1022</b>

          <span>
            Water Leakage • Medium • Gunadala
          </span>

          <Badge tone="warning">
            Scheduled
          </Badge>

          <button className="mini">
            View
          </button>

        </div>

      </div>
    </>
  );
}

function Escalations() {

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Escalations
          </h2>

          <p>
            Automatic escalation keeps unresolved
            reports accountable.
          </p>

        </div>

      </div>

      <div className="escalation-flow">

        {[
          "Local / Ward Authority",
          "Department Head",
          "Municipal Commissioner",
          "Higher / State Authority"
        ].map((x, i) => (

          <React.Fragment key={x}>

            <div className="authority-node">

              <b>{i + 1}</b>

              <span>{x}</span>

              {i < 3 && (
                <small>
                  Response deadline
                </small>
              )}

            </div>

            {i < 3 && (
              <div className="arrow">
                →
              </div>
            )}

          </React.Fragment>

        ))}

      </div>

      <div className="card">

        <h3>
          Active escalation
        </h3>

        <div className="inspection">

          <b>
            R-2026-0955
          </b>

          <span>
            No response after configured deadline
          </span>

          <Badge tone="danger">
            Escalated
          </Badge>

          <button className="mini">
            Open
          </button>

        </div>

      </div>
    </>
  );
}

function Analytics() {

  return (
    <>
      <div className="page-head">

        <div>

          <h2>
            Analytics
          </h2>

          <p>
            Use report data to identify recurring risk areas.
          </p>

        </div>

      </div>

      <div className="stats-grid">

        <Stat
          label="Reports this month"
          value="75"
        />

        <Stat
          label="Avg. response"
          value="2.4d"
        />

        <Stat
          label="Resolution rate"
          value="82%"
          tone="success"
        />

        <Stat
          label="Escalated"
          value="9"
          tone="danger"
        />

      </div>

      <section className="card">

        <h3>
          Monthly report trend
        </h3>

        <div className="chart">

          <div className="chart-line" />

          {[25, 38, 31, 52, 44, 67, 58, 75].map(
            (n, i) => (

              <div
                key={i}
                className="chart-bar"
                style={{
                  height: `${n}%`
                }}
              >
                <span>{n}</span>
              </div>

            )
          )}

        </div>

      </section>
    </>
  );
}

export default function App() {

  const [role, setRole] =
    useState(
      localStorage.getItem("role") ||
      "citizen"
    );

  useEffect(() => {

    localStorage.setItem(
      "role",
      role
    );

  }, [role]);

  return (
    <Layout
      role={role}
      setRole={setRole}
    />
  );
}
