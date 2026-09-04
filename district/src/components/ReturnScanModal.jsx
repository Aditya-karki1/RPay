import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function NearestHubMap({ isLowValue }) {
  const [hub,      setHub]      = useState(null);
  const [distKm,   setDistKm]   = useState(null);
  const [geoErr,   setGeoErr]   = useState(false);

  useEffect(() => {
    if (!isLowValue) return;
    fetch('/api/hubs')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const hubs = (data?.hubs || []).filter(h => h.lat && h.lng);
        if (!hubs.length) return;
        if (!navigator.geolocation) {
          setHub(hubs[0]);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            let nearest = hubs[0], minD = Infinity;
            hubs.forEach(h => {
              const d = haversineKm(lat, lng, h.lat, h.lng);
              if (d < minD) { minD = d; nearest = h; }
            });
            setHub(nearest);
            // Clamp to realistic local range (8–15 km) for demo purposes
            const clampedD = Math.min(15, Math.max(8, minD));
            setDistKm(clampedD);
          },
          () => { setGeoErr(true); setHub(hubs[0]); }
        );
      })
      .catch(() => {});
  }, [isLowValue]);

  if (!hub) return null;

  const bbox = `${hub.lng - 0.012},${hub.lat - 0.009},${hub.lng + 0.012},${hub.lat + 0.009}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${hub.lat},${hub.lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hub.lat},${hub.lng}`;

  return (
    <div className="rscan-map-wrap">
      <div className="rscan-map-header">
        <span className="rscan-map-pin">📍</span>
        <div>
          <div className="rscan-map-hub-name">{hub.name}</div>
          <div className="rscan-map-meta">
            {hub.address}
            {distKm != null && !geoErr && (
              <span className="rscan-map-dist"> · {distKm < 1 ? `${Math.round(distKm*1000)}m` : `${distKm.toFixed(1)}km`} away</span>
            )}
          </div>
        </div>
      </div>
      <div className="rscan-map-frame-wrap">
        <iframe
          title="District Hub Location"
          src={mapUrl}
          className="rscan-map-frame"
          loading="lazy"
        />
      </div>
      <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="rscan-map-directions-btn">
        Get Directions →
      </a>
    </div>
  );
}

let _scanSeq = 0; // increments each time the modal mounts

const SCAN_STEPS = [
  { pct: 0,   msg: 'Initializing AI scanner…' },
  { pct: 14,  msg: 'Loading captured image…' },
  { pct: 26,  msg: 'Detecting surface condition…' },
  { pct: 40,  msg: 'Analyzing wear patterns…' },
  { pct: 54,  msg: 'Checking stitching integrity…' },
  { pct: 67,  msg: 'Cross-referencing purchase history…' },
  { pct: 78,  msg: 'Verifying original packaging…' },
  { pct: 88,  msg: 'Assessing resale condition score…' },
  { pct: 96,  msg: 'Generating eligibility report…' },
  { pct: 100, msg: 'Scan complete.' },
];

function RefundCountdown({ amount }) {
  const TOTAL = 120; // 2 minutes in seconds
  const [sec, setSec] = useState(TOTAL);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSec(s => {
        if (s <= 1) { clearInterval(t); setDone(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  const pct  = ((TOTAL - sec) / TOTAL) * 100;

  return (
    <div className="rscan-refund-box">
      <div className="rscan-refund-header">
        <span className="rscan-refund-icon">💸</span>
        <div>
          <div className="rscan-refund-title">
            {done ? 'Refund Credited!' : 'Refund Processing'}
          </div>
          <div className="rscan-refund-amount">
            ₹{amount.toLocaleString('en-IN')} → your account
          </div>
        </div>
        {done && <span className="rscan-refund-done-badge">✓ Done</span>}
      </div>

      {!done ? (
        <>
          <div className="rscan-refund-progress-wrap">
            <div className="rscan-refund-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="rscan-refund-eta">
            ⏱ Credited in {mins}:{String(secs).padStart(2, '0')} — AI verified, no manual review needed
          </div>
        </>
      ) : (
        <div className="rscan-refund-success">
          ✅ Your refund of ₹{amount.toLocaleString('en-IN')} has been credited to your original payment method.
        </div>
      )}
    </div>
  );
}

export default function ReturnScanModal({ item, itemIndex, onClose, onConfirm, orderTotal = 0 }) {
  // phase: 'camera' → 'preview' → 'scanning' → 'result'
  const [phase,       setPhase]       = useState('camera');
  const [camError,    setCamError]    = useState(null);
  const [capturedImg, setCapturedImg] = useState(null);  // data-url of user photo
  const [facingMode,  setFacingMode]  = useState('environment');
  const [flash,       setFlash]       = useState(false);
  const [stepIdx,     setStepIdx]     = useState(0);
  const [progress,    setProgress]    = useState(0);
  const [dots,        setDots]        = useState('');

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);
  const seqRef      = useRef(null);

  // < ₹3000 unit price: AI always approves instantly. >= ₹3000: alternating sim (goes to merchant review)
  if (seqRef.current === null) seqRef.current = ++_scanSeq;
  const isLowValue   = orderTotal < 3000;                         // orderTotal = unit price
  const refundAmount = orderTotal * (item?.qty || 1);             // full refund for qty
  const approved     = isLowValue ? true : seqRef.current % 2 === 1;

  // AI grade for high-value items (deterministic per scan session)
  const gradeData = (() => {
    if (isLowValue || !approved) return null;
    const score = 70 + (seqRef.current * 13) % 26; // 70–95 range
    const grade = score >= 88 ? 'A' : score >= 75 ? 'B' : 'C';
    const labels = { A: 'Like New', B: 'Good Condition', C: 'Visible Wear' };
    const colors = { A: '#10B981', B: '#C8FF00', C: '#F59E0B' };
    return { grade, score, label: `Grade ${grade} – ${labels[grade]}`, color: colors[grade] };
  })();

  /* ── Camera helpers ─────────────────────────── */
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing) => {
    stopStream();
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCamError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow access and try again.'
        : 'Unable to access camera. Please check your device settings.');
    }
  }, [stopStream]);

  useEffect(() => {
    if (phase === 'camera') startCamera(facingMode);
    return () => { if (phase === 'camera') stopStream(); };
  }, [phase, facingMode, startCamera, stopStream]);

  // cleanup on unmount
  useEffect(() => () => { stopStream(); clearInterval(intervalRef.current); }, [stopStream]);

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const takePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // shutter flash
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    stopStream();
    setCapturedImg(dataUrl);
    setPhase('preview');
  };

  const startScan = () => {
    setPhase('scanning');
    let pct   = 0;
    let step  = 0;
    let dotCt = 0;

    intervalRef.current = setInterval(() => {
      dotCt = (dotCt + 1) % 4;
      setDots('.'.repeat(dotCt));

      pct = Math.min(pct + 1.4, 100);
      setProgress(pct);

      const next = SCAN_STEPS.findIndex(s => s.pct > pct);
      const cur  = next === -1 ? SCAN_STEPS.length - 1 : next - 1;
      if (cur !== step) { step = cur; setStepIdx(cur); }

      if (pct >= 100) {
        clearInterval(intervalRef.current);
        setTimeout(() => setPhase('result'), 400);
      }
    }, 40);
  };

  const retake = () => {
    setCapturedImg(null);
    setProgress(0);
    setStepIdx(0);
    setPhase('camera');
  };

  /* ── Render ─────────────────────────────────── */
  return (
    <div className="rscan-backdrop" onClick={phase === 'result' ? onClose : undefined}>
      <div className="rscan-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="rscan-header">
          <div className="rscan-header-left">
            <span className={`rscan-pulse-dot${phase === 'scanning' ? ' rscan-pulse-dot--active' : ''}`} />
            <span className="rscan-title">
              {phase === 'camera'   && 'Capture Product Photo'}
              {phase === 'preview'  && 'Confirm Photo'}
              {phase === 'scanning' && 'AI Return Scanner'}
              {phase === 'result'   && 'Scan Complete'}
            </span>
          </div>
          <button className="rscan-x" onClick={() => { stopStream(); onClose(); }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── CAMERA PHASE ── */}
        {phase === 'camera' && (
          <>
            <div className="rscan-cam-wrap">
              {camError ? (
                <div className="rscan-cam-error">
                  <div className="rscan-cam-error-icon">📷</div>
                  <div className="rscan-cam-error-msg">{camError}</div>
                  <button className="rscan-btn rscan-btn--ghost" style={{ marginTop: 12 }} onClick={() => startCamera(facingMode)}>
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="rscan-video" playsInline muted autoPlay />
                  {flash && <div className="rscan-flash" />}

                  {/* Viewfinder overlay */}
                  <div className="rscan-vf-overlay" aria-hidden="true">
                    <span className="rscan-corner rscan-corner--tl" />
                    <span className="rscan-corner rscan-corner--tr" />
                    <span className="rscan-corner rscan-corner--bl" />
                    <span className="rscan-corner rscan-corner--br" />
                    <div className="rscan-vf-hint">Place product within frame</div>
                  </div>
                </>
              )}
            </div>

            {/* Product reference strip */}
            <div className="rscan-ref-strip">
              <img src={item.img} alt={item.name} className="rscan-ref-img" />
              <div>
                <div className="rscan-ref-name">{item.name}</div>
                <div className="rscan-ref-meta">{item.brand}</div>
              </div>
            </div>

            {/* Camera controls */}
            {!camError && (
              <div className="rscan-cam-controls">
                <button className="rscan-flip-btn" onClick={flipCamera} aria-label="Flip camera">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </button>
                <button className="rscan-shutter-btn" onClick={takePhoto} aria-label="Take photo">
                  <span className="rscan-shutter-inner" />
                </button>
                <div style={{ width: 48 }} />
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        )}

        {/* ── PREVIEW PHASE ── */}
        {phase === 'preview' && capturedImg && (
          <>
            <div className="rscan-img-wrap">
              <img src={capturedImg} alt="Captured product" className="rscan-img" />
              <span className="rscan-corner rscan-corner--tl" />
              <span className="rscan-corner rscan-corner--tr" />
              <span className="rscan-corner rscan-corner--bl" />
              <span className="rscan-corner rscan-corner--br" />
            </div>

            <div className="rscan-product-info">
              <div className="rscan-product-name">{item.name}</div>
              <div className="rscan-product-meta">Photo captured — ready to scan</div>
            </div>

            <div className="rscan-preview-actions">
              <button className="rscan-btn rscan-btn--ghost" onClick={retake}>↩ Retake</button>
              <button className="rscan-btn rscan-btn--scan" onClick={startScan}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
                </svg>
                Scan Now
              </button>
            </div>
          </>
        )}

        {/* ── SCANNING PHASE ── */}
        {phase === 'scanning' && capturedImg && (
          <>
            <div className="rscan-img-wrap">
              <img src={capturedImg} alt="Scanning" className="rscan-img" />
              <div className="rscan-grid" aria-hidden="true" />
              <span className="rscan-corner rscan-corner--tl" />
              <span className="rscan-corner rscan-corner--tr" />
              <span className="rscan-corner rscan-corner--bl" />
              <span className="rscan-corner rscan-corner--br" />
              <div className="rscan-beam" aria-hidden="true">
                <div className="rscan-beam-line" />
                <div className="rscan-beam-trail" />
              </div>
              <span className="rscan-datapt rscan-datapt--1">CON</span>
              <span className="rscan-datapt rscan-datapt--2">STR</span>
              <span className="rscan-datapt rscan-datapt--3">WR</span>
              <span className="rscan-datapt rscan-datapt--4">AUTH</span>
            </div>

            <div className="rscan-product-info">
              <div className="rscan-product-name">{item.name}</div>
              <div className="rscan-product-meta">{item.brand} · ₹{item.price.toLocaleString('en-IN')} · Qty {item.qty}</div>
            </div>

            <div className="rscan-status">
              <div className="rscan-status-row">
                <span className="rscan-status-msg">{SCAN_STEPS[stepIdx].msg}{dots}</span>
                <span className="rscan-status-pct">{Math.round(progress)}%</span>
              </div>
              <div className="rscan-progress">
                <div className="rscan-progress-fill" style={{ width: `${progress}%` }} />
                <div className="rscan-progress-glow" style={{ left: `${Math.max(0, progress - 4)}%` }} />
              </div>
              <div className="rscan-scan-checks">
                {['Condition', 'Authenticity', 'Wear', 'History'].map((label, i) => (
                  <span key={label} className={`rscan-check${progress > (i+1)*22 ? ' rscan-check--done' : progress > i*22 ? ' rscan-check--active' : ''}`}>
                    {progress > (i+1)*22 ? '✓ ' : progress > i*22 ? '⟳ ' : '○ '}{label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── RESULT PHASE ── */}
        {phase === 'result' && capturedImg && (
          <>
            <div className={`rscan-img-wrap${approved ? ' rscan-img-wrap--approved' : ' rscan-img-wrap--declined'}`}>
              <img src={capturedImg} alt="Scanned" className="rscan-img" style={{ filter: approved ? 'brightness(0.6) saturate(0.6)' : 'brightness(0.5) saturate(0.4)' }} />
              <div className={`rscan-result-overlay${approved ? ' rscan-result-overlay--ok' : ' rscan-result-overlay--fail'}`}>
                <div className="rscan-result-icon">{approved ? '✓' : '✕'}</div>
                <div className="rscan-result-label">{approved ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</div>
              </div>
            </div>

            <div className="rscan-product-info">
              <div className="rscan-product-name">{item.name}</div>
              <div className="rscan-product-meta">{item.brand} · ₹{item.price.toLocaleString('en-IN')}</div>
            </div>

            <div className={`rscan-verdict${approved ? ' rscan-verdict--ok' : ' rscan-verdict--fail'}`}>
              <div className="rscan-verdict-top">
                <span className={`rscan-verdict-badge${approved ? ' rscan-verdict-badge--ok' : ' rscan-verdict-badge--fail'}`}>
                  {approved
                    ? (isLowValue ? '⚡ AI Auto-Approved' : '✓ Return Approved')
                    : '✕ Return Declined'}
                </span>
              </div>

              {/* AI instant refund block for < ₹3000 */}
              {approved && isLowValue && (
                <>
                  <RefundCountdown amount={refundAmount} />
                  <div className="rscan-hub-notice">
                    <span className="rscan-hub-icon">📦</span>
                    <div>
                      <div className="rscan-hub-title">⚡ Item queued for District Hub</div>
                      <div className="rscan-hub-sub">Your item will be stored at a nearby hub and made available for instant delivery to the next buyer in your area</div>
                    </div>
                  </div>
                  <NearestHubMap isLowValue={isLowValue} />
                </>
              )}

              {approved && !isLowValue && (
                <>
                  {gradeData && (
                    <div className="rscan-grade-block">
                      <div className="rscan-grade-badge" style={{ background: gradeData.color + '22', color: gradeData.color, border: `1px solid ${gradeData.color}44` }}>
                        <span className="rscan-grade-letter">{gradeData.grade}</span>
                        <span className="rscan-grade-label">{gradeData.label}</span>
                        <span className="rscan-grade-score">AI Score: {gradeData.score}/100</span>
                      </div>
                      <div className="rscan-grade-hint">AI condition report will be shared with the merchant for review.</div>
                    </div>
                  )}
                  <div className="rscan-verdict-reason">
                    Product condition meets return standards. This return will be reviewed by our merchant team.
                  </div>
                  <div className="rscan-manual-tag">₹{refundAmount.toLocaleString('en-IN')} · Sent to merchant for manual review</div>
                </>
              )}
              {!approved && (
                <div className="rscan-rejection-box">
                  <div className="rscan-rejection-title">❌ Return Rejected</div>
                  <div className="rscan-rejection-reason">
                    <strong>Reason:</strong> Our AI scan detected that this product is in a <strong>low-grade condition</strong> — it shows signs of excessive wear, damage, or use beyond acceptable return limits.
                  </div>
                  <div className="rscan-rejection-policy">
                    This does not meet our return quality standards. The item cannot be accepted back into inventory.
                  </div>
                  <div className="rscan-rejection-contact">
                    <span className="rscan-rejection-contact-label">Need help? Contact Customer Care:</span>
                    <div className="rscan-rejection-contact-row">
                      <span>📞</span>
                      <span>1800-123-4567 <span className="rscan-free-tag">Toll Free</span></span>
                    </div>
                    <div className="rscan-rejection-contact-row">
                      <span>📧</span>
                      <span>support@district.in</span>
                    </div>
                    <div className="rscan-rejection-contact-row">
                      <span>💬</span>
                      <span>Live chat · Mon–Sat, 9 AM – 9 PM</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="rscan-verdict-actions">
                <button className="rscan-btn rscan-btn--ghost" onClick={onClose}>Close</button>
                {approved && (
                  <button className="rscan-btn rscan-btn--confirm" onClick={() => onConfirm({ capturedImg, gradeData })}>
                    Confirm Return
                  </button>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
