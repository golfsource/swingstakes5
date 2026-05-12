import { useState, useEffect, useRef } from "react";

// ============================================================
// THEME & CONSTANTS
// ============================================================
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C96A";
const DARK_GREEN = "#0F2318";
const MID_GREEN = "#1A3A2A";
const CARD_BG = "#111f17";
const SURFACE = "#172B1F";
const BORDER = "#2A4A35";
const TEXT_PRIMARY = "#F5F0E8";
const TEXT_MUTED = "#8BA898";
const RED_LOSS = "#E05252";
const GREEN_WIN = "#4CAF7D";

const GAME_TYPES = [
  { id: "play_golf", name: "Play Golf", players: "1 - 5 Players", desc: "Standard stroke play round. Track scores and junk bets for 1-5 players." },
  { id: "wolf", name: "Wolf", players: "4 - 5 Players", desc: "One player per hole is the Wolf and picks a partner after each tee shot, or goes alone (Lone Wolf)." },
  { id: "skins", name: "Skins", players: "Up to 5 Players", desc: "Each hole is worth a skin. Lowest score wins the skin. Ties carry over." },
  { id: "round_robin", name: "Round Robin", players: "4 Players", desc: "Partners rotate every 6 holes. Formats: Rotating, Wolf, or Sixes." },
  { id: "nassau", name: "Nassau", players: "2 - 4 Players", desc: "Three separate bets: front 9, back 9, and overall 18." },
  { id: "two_man_lowball", name: "2 Man Low Ball", players: "4 Players", desc: "Teams of 2. Lowest ball score from each team counts per hole." },
  { id: "banker", name: "Banker", players: "3 or More Players", desc: "One player each hole is the Banker and plays against all others individually." },
  { id: "match_play", name: "Match Play", players: "2 Players", desc: "Hole-by-hole competition. Win holes, not strokes." },
  { id: "two_man_scramble", name: "2 Man Scramble", players: "4 or 6 Players", desc: "Both teammates hit, best shot is chosen. Repeat until holed." },
  { id: "nine_sixteen_twenty_five", name: "9/16/25 Point", players: "3 - 5 Players", desc: "Points awarded each hole. 1st=5pts, 2nd=3pts, 3rd=1pt. Ties split." },
  { id: "vegas", name: "Vegas", players: "4 Players", desc: "Two 2-man teams. Combine each player's score into a 2-digit number (low digit first). Lower number wins the hole. Three formats: 6/6/6 rotating, Assigned, or Dynamic partners." },
];

const JUNK_BETS = [
  { id: "greenies", name: "Greenies", desc: "Closest to pin on par 3s" },
  { id: "sandies", name: "Sandies", desc: "Par or better from a sand trap" },
  { id: "fairway", name: "Fairway", desc: "Hit the fairway off the tee" },
  { id: "pullies", name: "Pullies", desc: "Won on a hole you pulled (made a putt)" },
  { id: "birdies", name: "Birdies", desc: "Score a birdie" },
  { id: "eagles", name: "Eagles", desc: "Score an eagle" },
  { id: "long_drive", name: "Long Drive", desc: "Longest drive on designated hole" },
  { id: "snake", name: "Snake/3 Putt", desc: "Last player to 3-putt holds the snake" },
  { id: "points", name: "Points", desc: "Stableford-style points system" },
  { id: "gir", name: "GIR/Hogan", desc: "Green in regulation" },
  { id: "custom", name: "Custom", desc: "Create your own junk bet" },
];

const SAMPLE_COURSES = [
  { id: 1, name: "Rockwall Golf & Athletic Club", address: "2600 Champions Dr, Rockwall, TX", distance: "2 miles", tees: [{ color: "Gold", rating: 74.9, slope: 132, par: 71 }, { color: "Blue", rating: 72.2, slope: 127, par: 71 }, { color: "White", rating: 68.8, slope: 124, par: 71 }, { color: "Green", rating: 66.1, slope: 113, par: 71 }] },
  { id: 2, name: "Buffalo Creek Golf Club", address: "624 Country Club Dr, Rockwall, TX", distance: "6 miles", tees: [{ color: "Gold", rating: 74.9, slope: 132, par: 71 }, { color: "Blue", rating: 72.2, slope: 127, par: 71 }, { color: "White", rating: 68.8, slope: 124, par: 71 }, { color: "Green", rating: 66.1, slope: 113, par: 71 }] },
  { id: 3, name: "Waterview Golf Club", address: "9509 Waterview Pkwy, Rowlett, TX", distance: "5 miles", tees: [{ color: "Black", rating: 75.1, slope: 134, par: 72 }, { color: "Blue", rating: 72.5, slope: 129, par: 72 }, { color: "White", rating: 69.4, slope: 122, par: 72 }] },
  { id: 4, name: "Woodbridge Golf Club", address: "7400 Country Club Dr, Wylie, TX", distance: "6 miles", tees: [{ color: "Gold", rating: 73.8, slope: 130, par: 72 }, { color: "Blue", rating: 71.1, slope: 125, par: 72 }, { color: "White", rating: 68.5, slope: 120, par: 72 }] },
  { id: 5, name: "Stone River Golf Club", address: "2001 Stone River Blvd, Royse City, TX", distance: "9 miles", tees: [{ color: "Gold", rating: 73.2, slope: 128, par: 71 }, { color: "Blue", rating: 70.8, slope: 123, par: 71 }, { color: "White", rating: 67.9, slope: 118, par: 71 }] },
];

const HOLE_DATA = Array.from({ length: 18 }, (_, i) => ({
  hole: i + 1,
  par: [4,4,5,3,4,4,3,4,5,4,3,4,5,4,3,4,4,5][i],
  yardage: [408,435,572,227,347,478,183,412,540,388,165,423,568,342,198,456,378,512][i],
  handicap: [9,11,3,15,13,1,17,7,5,10,16,4,2,14,18,6,12,8][i],
}));

const TEE_COLORS = { Gold: "#D4A017", Blue: "#2563EB", White: "#F8F8F8", Green: "#16A34A", Black: "#1a1a1a", Red: "#DC2626" };

// ============================================================
// UTILITIES
// ============================================================
function calcCourseHandicap(index, slope, rating, par, pct = 1.0) {
  return Math.round((index * (slope / 113) + (rating - par)) * pct);
}

// ============================================================
// VEGAS LOGIC
// ============================================================

// Build a Vegas 2-digit team score: low score first, e.g. 4+5 → 45, 5+4 → 45
function vegasTeamScore(s1, s2) {
  if (!s1 || !s2) return null;
  const lo = Math.min(s1, s2);
  const hi = Math.max(s1, s2);
  return lo * 10 + hi;
}

// 6/6/6: fixed teams for holes 1-6, swap one player holes 7-12, swap again 13-18
function getVegas666Teams(players, holeNum) {
  if (players.length < 4) return null;
  const [a, b, c, d] = players;
  if (holeNum <= 6)  return { teamA: [a, b], teamB: [c, d] };
  if (holeNum <= 12) return { teamA: [a, c], teamB: [b, d] };
  return                    { teamA: [a, d], teamB: [b, c] };
}

// Assigned: fixed teams all 18 — stored in setup.vegasTeams
function getVegasAssignedTeams(players, setup) {
  const t = setup.vegasTeams;
  if (!t) return { teamA: [players[0], players[1]], teamB: [players[2], players[3]] };
  return {
    teamA: players.filter(p => t.teamA.includes(p.id)),
    teamB: players.filter(p => t.teamB.includes(p.id)),
  };
}

// Dynamic: after hole 1+, low score on prev hole + low score on other side become partners
// Hole 1 uses assigned/default teams; subsequent holes re-pair high+low together
function getVegasDynamicTeams(players, holeNum, scores) {
  if (holeNum <= 1 || players.length < 4) {
    return { teamA: [players[0], players[1]], teamB: [players[2], players[3]] };
  }
  const prevHole = holeNum - 1;
  const sorted = [...players].sort((a, b) => {
    const sa = scores[a.id]?.[prevHole] || 99;
    const sb = scores[b.id]?.[prevHole] || 99;
    return sa - sb;
  });
  // pair 1st+4th (best+worst) and 2nd+3rd
  return { teamA: [sorted[0], sorted[3]], teamB: [sorted[1], sorted[2]] };
}

function getVegasTeams(players, holeNum, setup, scores) {
  const variant = setup.vegasVariant || "assigned";
  if (variant === "666")      return getVegas666Teams(players, holeNum);
  if (variant === "dynamic")  return getVegasDynamicTeams(players, holeNum, scores);
  return getVegasAssignedTeams(players, setup);
}

// Returns points difference per hole: positive = teamA won, negative = teamB won
function calcVegasHoleResult(teamA, teamB, holeNum, scores) {
  const sA1 = scores[teamA[0]?.id]?.[holeNum] || 0;
  const sA2 = scores[teamA[1]?.id]?.[holeNum] || 0;
  const sB1 = scores[teamB[0]?.id]?.[holeNum] || 0;
  const sB2 = scores[teamB[1]?.id]?.[holeNum] || 0;
  if (!sA1 || !sA2 || !sB1 || !sB2) return 0;
  const vsA = vegasTeamScore(sA1, sA2);
  const vsB = vegasTeamScore(sB1, sB2);
  if (vsA === vsB) return 0;
  return vsA < vsB ? -(vsB - vsA) : (vsA - vsB); // negative = teamA wins (lower is better)
}

// Cumulative earnings per player across all completed holes
function calcVegasEarnings(players, setup, scores, currentHole, betAmount) {
  const earnings = {};
  players.forEach(p => earnings[p.id] = 0);
  const bet = betAmount || 10;

  for (let h = 1; h < currentHole; h++) {
    const { teamA, teamB } = getVegasTeams(players, h, setup, scores);
    if (!teamA || !teamB || teamA.length < 2 || teamB.length < 2) continue;
    const diff = calcVegasHoleResult(teamA, teamB, h, scores);
    if (diff === 0) continue;
    const amount = Math.abs(diff) * bet;
    if (diff < 0) {
      // teamA wins
      teamA.forEach(p => earnings[p.id] += amount);
      teamB.forEach(p => earnings[p.id] -= amount);
    } else {
      // teamB wins
      teamB.forEach(p => earnings[p.id] += amount);
      teamA.forEach(p => earnings[p.id] -= amount);
    }
  }
  return earnings;
}

// ============================================================
// COMPONENTS
// ============================================================

function Logo({ size = 48 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${MID_GREEN}, ${DARK_GREEN})`,
        border: `2px solid ${GOLD}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 16px ${GOLD}44`,
        fontSize: size * 0.4, flexShrink: 0,
      }}>⛳</div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: size * 0.45, color: GOLD, letterSpacing: 1, lineHeight: 1 }}>SWING</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: size * 0.35, color: TEXT_PRIMARY, letterSpacing: 2, lineHeight: 1 }}>STAKES</div>
      </div>
    </div>
  );
}

function GoldButton({ children, onClick, style = {}, variant = "primary", disabled = false }) {
  const base = {
    padding: "14px 24px", borderRadius: 12, fontWeight: 700, fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer", border: "none", width: "100%",
    transition: "all 0.2s", letterSpacing: 0.5, opacity: disabled ? 0.5 : 1,
  };
  const styles = {
    primary: { background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`, color: DARK_GREEN, boxShadow: `0 4px 20px ${GOLD}44` },
    secondary: { background: "transparent", color: GOLD, border: `1.5px solid ${GOLD}`, boxShadow: "none" },
    ghost: { background: SURFACE, color: TEXT_PRIMARY, border: `1px solid ${BORDER}`, boxShadow: "none" },
    danger: { background: `linear-gradient(135deg, #E05252, #B03030)`, color: "#fff", boxShadow: "0 4px 20px #E0525244" },
  };
  return <button style={{ ...base, ...styles[variant], ...style }} onClick={disabled ? undefined : onClick}>{children}</button>;
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: 16, cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s", ...style,
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "translateY(0)"; } }}
    >{children}</div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, style = {} }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "12px 14px", background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: 10, color: TEXT_PRIMARY, fontSize: 15, outline: "none",
          boxSizing: "border-box", fontFamily: "inherit",
          ...style,
        }}
        onFocus={e => e.target.style.borderColor = GOLD}
        onBlur={e => e.target.style.borderColor = BORDER}
      />
    </div>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", background: SURFACE, borderRadius: 10, padding: 3, border: `1px solid ${BORDER}` }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
          background: value === opt.value ? `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` : "transparent",
          color: value === opt.value ? DARK_GREEN : TEXT_MUTED,
          fontWeight: value === opt.value ? 700 : 500, fontSize: 14, transition: "all 0.2s",
        }}>{opt.label}</button>
      ))}
    </div>
  );
}

function BottomNav({ active, setScreen }) {
  const tabs = [
    { id: "home", label: "Home", icon: "⛳" },
    { id: "games", label: "My Games", icon: "🏌️" },
    { id: "history", label: "History", icon: "📋" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: DARK_GREEN, borderTop: `1px solid ${BORDER}`,
      display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 8px)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setScreen(t.id)} style={{
          flex: 1, padding: "10px 4px 6px", border: "none", background: "transparent",
          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 10, color: active === t.id ? GOLD : TEXT_MUTED, fontWeight: active === t.id ? 700 : 400, letterSpacing: 0.3 }}>{t.label}</span>
          {active === t.id && <div style={{ width: 20, height: 2, background: GOLD, borderRadius: 1 }} />}
        </button>
      ))}
    </div>
  );
}

function MoneyBadge({ amount }) {
  const isPos = amount >= 0;
  return (
    <span style={{
      color: isPos ? GREEN_WIN : RED_LOSS,
      fontWeight: 700, fontSize: 15,
      textShadow: isPos ? `0 0 8px ${GREEN_WIN}66` : `0 0 8px ${RED_LOSS}66`,
    }}>
      {isPos ? "+" : ""}${Math.abs(amount).toFixed(2)}
    </span>
  );
}

function StepProgress({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 2,
          background: i < current ? `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})` : BORDER,
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

// ============================================================
// SCREENS
// ============================================================

// --- SPLASH ---
function SplashScreen({ onContinue }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", background: `radial-gradient(ellipse at top, ${MID_GREEN} 0%, ${DARK_GREEN} 60%)`,
      padding: 32, gap: 32,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 16, filter: "drop-shadow(0 0 24px #C9A84C88)" }}>⛳</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 52, color: GOLD, letterSpacing: 2, lineHeight: 1, textShadow: `0 4px 32px ${GOLD}66` }}>SWING</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 38, color: TEXT_PRIMARY, letterSpacing: 6, lineHeight: 1 }}>STAKES</div>
        <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: "16px auto" }} />
        <div style={{ color: TEXT_MUTED, fontSize: 14, letterSpacing: 1 }}>GOLF BETTING, ELEVATED</div>
      </div>
      <div style={{ textAlign: "center", maxWidth: 300 }}>
        <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.6 }}>Track every bet, every birdie, and every dollar — in real time on the course.</p>
      </div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <GoldButton onClick={onContinue}>Get Started</GoldButton>
      </div>
    </div>
  );
}

// --- AUTH ---
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  return (
    <div style={{
      minHeight: "100vh", background: DARK_GREEN, padding: "48px 24px 32px",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ marginBottom: 32 }}><Logo size={40} /></div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif", fontSize: 28, margin: 0 }}>{mode === "login" ? "Welcome back" : "Create account"}</h1>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: "6px 0 0" }}>{mode === "login" ? "Sign in to your account" : "Let's get you on the course"}</p>
      </div>
      {mode === "signup" && (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Input label="First Name" value={firstName} onChange={setFirstName} placeholder="John" /></div>
          <div style={{ flex: 1 }}><Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Smith" /></div>
        </div>
      )}
      <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="john@example.com" />
      <Input label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
      <div style={{ marginTop: 8, marginBottom: 24 }}>
        <GoldButton onClick={onLogin}>{mode === "login" ? "Sign In" : "Sign Up"}</GoldButton>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ color: TEXT_MUTED, fontSize: 14 }}>{mode === "login" ? "Don't have an account? " : "Already have an account? "}</span>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
          {mode === "login" ? "Sign Up" : "Sign In"}
        </button>
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={onLogin} style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer", fontSize: 13, textAlign: "center" }}>Continue as Guest</button>
    </div>
  );
}

// --- HOME ---
function HomeScreen({ setScreen, setGameSetup }) {
  const [tab, setTab] = useState("courses");
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_COURSES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: DARK_GREEN, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${MID_GREEN} 0%, ${DARK_GREEN} 100%)`, padding: "52px 20px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Logo size={36} />
          <button style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px", color: TEXT_MUTED, cursor: "pointer", fontSize: 18 }}>🔔</button>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setTab("courses")} style={{
            flex: 1, padding: "12px 0", borderRadius: 10, border: `1.5px solid ${tab === "courses" ? GOLD : BORDER}`,
            background: tab === "courses" ? `${GOLD}22` : SURFACE, color: tab === "courses" ? GOLD : TEXT_MUTED,
            cursor: "pointer", fontWeight: 600, fontSize: 14,
          }}>📍 Nearby Courses</button>
          <button onClick={() => setTab("games")} style={{
            flex: 1, padding: "12px 0", borderRadius: 10, border: `1.5px solid ${tab === "games" ? GOLD : BORDER}`,
            background: tab === "games" ? `${GOLD}22` : SURFACE, color: tab === "games" ? GOLD : TEXT_MUTED,
            cursor: "pointer", fontWeight: 600, fontSize: 14,
          }}>🎮 Game Types</button>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {tab === "courses" ? (
          <>
            <Input placeholder="🔍  Search courses..." value={search} onChange={setSearch} style={{ marginBottom: 4 }} />
            <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 12 }}>{filtered.length} courses nearby</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(c => (
                <Card key={c.id} onClick={() => { setGameSetup(prev => ({ ...prev, course: c })); setScreen("game_setup"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{c.name}</div>
                      <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 6 }}>{c.address}</div>
                      <div style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>📍 {c.distance}</div>
                    </div>
                    <span style={{ color: TEXT_MUTED, fontSize: 18 }}>›</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 12 }}>Select any game below to start play</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {GAME_TYPES.map(g => (
                <Card key={g.id} onClick={() => { setGameSetup(prev => ({ ...prev, gameType: g })); setScreen("game_setup"); }}>
                  <div style={{ color: GOLD, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{g.name}</div>
                  <div style={{ color: TEXT_MUTED, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>👥</span> {g.players}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- GAME SETUP WIZARD ---
function GameSetupScreen({ setup, setSetup, setScreen, setActiveGame }) {
  const [step, setStep] = useState(1);

  const next = () => { if (step < 4) setStep(s => s + 1); else launchGame(); };
  const back = () => { if (step > 1) setStep(s => s - 1); else setScreen("home"); };

  const launchGame = () => {
    const game = {
      id: Date.now(),
      ...setup,
      holes: HOLE_DATA.map(h => ({
        ...h,
        scores: setup.players.reduce((a, p) => ({ ...a, [p.id]: 0 }), {}),
        bets: setup.players.reduce((a, p) => ({ ...a, [p.id]: 0 }), {}),
        banker: null,
        completed: false,
      })),
      currentHole: 1,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setActiveGame(game);
    setScreen("scorecard");
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK_GREEN, paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ background: MID_GREEN, padding: "52px 20px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={back} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT_PRIMARY, cursor: "pointer", fontSize: 16 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Game Setup</div>
            <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 17 }}>
              {["Course & Options", "Bet Types", "Invite Players", "Game Lobby"][step - 1]}
            </div>
          </div>
          <div style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>{step} of 4</div>
        </div>
        <StepProgress current={step} total={4} />
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {step === 1 && <Step1CourseOptions setup={setup} setSetup={setSetup} />}
        {step === 2 && <Step2BetTypes setup={setup} setSetup={setSetup} />}
        {step === 3 && <Step3InvitePlayers setup={setup} setSetup={setSetup} />}
        {step === 4 && <Step4GameLobby setup={setup} setSetup={setSetup} />}
      </div>

      <div style={{ padding: "20px 20px 0", display: "flex", gap: 12 }}>
        {step > 1 && <GoldButton variant="secondary" onClick={back} style={{ flex: 1 }}>Back</GoldButton>}
        <GoldButton onClick={next} style={{ flex: step > 1 ? 1 : undefined }}>
          {step === 4 ? "🚀 Start Game" : "Next →"}
        </GoldButton>
      </div>
    </div>
  );
}

function Step1CourseOptions({ setup, setSetup }) {
  const [showTeeModal, setShowTeeModal] = useState(false);
  const course = setup.course || SAMPLE_COURSES[0];
  const tees = course.tees || [];

  return (
    <div>
      {/* Course info */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 16 }}>{course.name}</div>
        <div style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 2 }}>{setup.gameType?.name || "Select a game"} • {new Date().toLocaleDateString()}</div>
      </Card>

      {!setup.gameType && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Game Type</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GAME_TYPES.map(g => (
              <button key={g.id} onClick={() => setSetup(s => ({ ...s, gameType: g }))} style={{
                padding: "12px 10px", borderRadius: 10, border: `1.5px solid ${setup.gameType?.id === g.id ? GOLD : BORDER}`,
                background: setup.gameType?.id === g.id ? `${GOLD}22` : SURFACE,
                color: setup.gameType?.id === g.id ? GOLD : TEXT_MUTED,
                cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 600,
              }}>{g.name}<br /><span style={{ fontSize: 11, fontWeight: 400 }}>{g.players}</span></button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Holes</div>
        <Toggle options={[{ value: 18, label: "18 Holes" }, { value: 9, label: "9 Holes" }]} value={setup.holes || 18} onChange={v => setSetup(s => ({ ...s, holes: v }))} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Starting Hole</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 10].map(h => (
            <button key={h} onClick={() => setSetup(s => ({ ...s, startingHole: h }))} style={{
              flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${setup.startingHole === h ? GOLD : BORDER}`,
              background: setup.startingHole === h ? `${GOLD}22` : SURFACE,
              color: setup.startingHole === h ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 600,
            }}>Hole {h}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Tee</div>
          <button onClick={() => setShowTeeModal(true)} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>See More</button>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {tees.map(t => (
            <button key={t.color} onClick={() => setSetup(s => ({ ...s, tee: t }))} style={{
              padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${setup.tee?.color === t.color ? GOLD : BORDER}`,
              background: setup.tee?.color === t.color ? `${GOLD}22` : SURFACE, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              color: setup.tee?.color === t.color ? GOLD : TEXT_MUTED, fontSize: 13, fontWeight: 600,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: TEE_COLORS[t.color] || GOLD }} />
                {t.color}
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{t.rating}/{t.slope}/{t.par}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Handicap Adjustment (P.H.™)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[100, 95, 90, 85, 80].map(p => (
            <button key={p} onClick={() => setSetup(s => ({ ...s, handicapPct: p }))} style={{
              padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${setup.handicapPct === p ? GOLD : BORDER}`,
              background: setup.handicapPct === p ? `${GOLD}22` : SURFACE,
              color: setup.handicapPct === p ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 600,
            }}>{p}%</button>
          ))}
        </div>
        <button onClick={() => setSetup(s => ({ ...s, handicapPct: 0 }))} style={{
          width: "100%", marginTop: 8, padding: 12, borderRadius: 10, border: `1.5px solid ${setup.handicapPct === 0 ? GOLD : BORDER}`,
          background: setup.handicapPct === 0 ? `${GOLD}22` : SURFACE,
          color: setup.handicapPct === 0 ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>Everyone plays without handicap (Gross)</button>
      </div>

      {showTeeModal && (
        <Modal title="Tee Settings" onClose={() => setShowTeeModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {tees.map(t => (
              <button key={t.color} onClick={() => { setSetup(s => ({ ...s, tee: t })); setShowTeeModal(false); }} style={{
                padding: 14, borderRadius: 12, border: `2px solid ${setup.tee?.color === t.color ? GOLD : BORDER}`,
                background: setup.tee?.color === t.color ? `${GOLD}22` : SURFACE, cursor: "pointer",
                color: setup.tee?.color === t.color ? GOLD : TEXT_PRIMARY, textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: TEE_COLORS[t.color] || GOLD }} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{t.color}</span>
                </div>
                <div style={{ fontSize: 12, color: TEXT_MUTED }}>{t.rating}/{t.slope}/{t.par}</div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Vegas Team Assignment UI
function VegasTeamAssigner({ setup, setSetup }) {
  const players = setup.players || [];
  const [drag, setDrag] = useState(null);
  const teams = setup.vegasTeams || { teamA: players.slice(0, 2).map(p => p.id), teamB: players.slice(2, 4).map(p => p.id) };

  const moveToTeam = (playerId, team) => {
    const other = team === "teamA" ? "teamB" : "teamA";
    const newTeams = {
      teamA: [...teams.teamA.filter(id => id !== playerId), ...(team === "teamA" ? [playerId] : [])],
      teamB: [...teams.teamB.filter(id => id !== playerId), ...(team === "teamB" ? [playerId] : [])],
    };
    setSetup(s => ({ ...s, vegasTeams: newTeams }));
  };

  const getTeamPlayers = (teamKey) =>
    (teams[teamKey] || []).map(id => players.find(p => p.id === id)).filter(Boolean);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Assign Teams</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {["teamA", "teamB"].map((teamKey, ti) => (
          <div key={teamKey} style={{ background: SURFACE, border: `2px solid ${ti === 0 ? GOLD : GREEN_WIN}`, borderRadius: 12, padding: 12 }}>
            <div style={{ color: ti === 0 ? GOLD : GREEN_WIN, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              {ti === 0 ? "⛳ Team A" : "🏌️ Team B"}
            </div>
            {getTeamPlayers(teamKey).map(p => (
              <div key={p.id} style={{ background: CARD_BG, borderRadius: 8, padding: "8px 10px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                <button onClick={() => moveToTeam(p.id, teamKey === "teamA" ? "teamB" : "teamA")} style={{
                  background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT_MUTED,
                  cursor: "pointer", fontSize: 11, padding: "3px 6px",
                }}>⇄</button>
              </div>
            ))}
            {getTeamPlayers(teamKey).length === 0 && (
              <div style={{ color: TEXT_MUTED, fontSize: 12, textAlign: "center", padding: "8px 0" }}>Empty</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, color: TEXT_MUTED, fontSize: 12, textAlign: "center" }}>Tap ⇄ to swap players between teams</div>
    </div>
  );
}

function Step2BetTypes({ setup, setSetup }) {
  const isBanker = setup.gameType?.id === "banker";
  const isRoundRobin = setup.gameType?.id === "round_robin";
  const isVegas = setup.gameType?.id === "vegas";
  const gameId = setup.gameType?.id || "play_golf";

  const toggleBetType = (bt) => {
    const curr = setup.betTypes || [];
    setSetup(s => ({ ...s, betTypes: curr.includes(bt) ? curr.filter(x => x !== bt) : [...curr, bt] }));
  };
  const toggleJunk = (j) => {
    const curr = setup.junkBets || [];
    setSetup(s => ({ ...s, junkBets: curr.includes(j) ? curr.filter(x => x !== j) : [...curr, j] }));
  };

  return (
    <div>
      {/* ── VEGAS SETUP ─────────────────────────────────── */}
      {isVegas && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Vegas Format</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { id: "assigned",  icon: "🤝", label: "Assigned Teams",  sub: "Fixed partners all 18 holes" },
                { id: "666",       icon: "🔄", label: "6 / 6 / 6",       sub: "Teams rotate every 6 holes (holes 1-6, 7-12, 13-18)" },
                { id: "dynamic",   icon: "⚡", label: "Dynamic",         sub: "High & low scorer re-pair as teammates each hole" },
              ].map(v => (
                <button key={v.id} onClick={() => setSetup(s => ({ ...s, vegasVariant: v.id }))} style={{
                  padding: "14px 16px", borderRadius: 12, border: `2px solid ${setup.vegasVariant === v.id ? GOLD : BORDER}`,
                  background: setup.vegasVariant === v.id ? `${GOLD}18` : SURFACE,
                  cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
                  boxShadow: setup.vegasVariant === v.id ? `0 0 16px ${GOLD}33` : "none",
                  transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: 24 }}>{v.icon}</span>
                  <div>
                    <div style={{ color: setup.vegasVariant === v.id ? GOLD : TEXT_PRIMARY, fontWeight: 700, fontSize: 15 }}>{v.label}</div>
                    <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>{v.sub}</div>
                  </div>
                  {setup.vegasVariant === v.id && <span style={{ marginLeft: "auto", color: GOLD, fontSize: 18 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* How Vegas scoring works explainer */}
          <Card style={{ marginBottom: 16, background: `${GOLD}0D`, border: `1px solid ${GOLD}44` }}>
            <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>💡 How Vegas Scoring Works</div>
            <div style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 1.6 }}>
              Each team's two scores are combined into a 2-digit number — <span style={{ color: TEXT_PRIMARY }}>low score first</span>. Example: scores of 4 & 6 = <span style={{ color: GOLD, fontWeight: 700 }}>46</span>. Opponent scores of 3 & 5 = <span style={{ color: GREEN_WIN, fontWeight: 700 }}>35</span>. Lower number wins — difference × bet amount is paid out per hole.
            </div>
          </Card>

          {/* Assigned teams: show team assigner once players are added */}
          {setup.vegasVariant === "assigned" && (setup.players || []).length >= 4 && (
            <VegasTeamAssigner setup={setup} setSetup={setSetup} />
          )}
          {setup.vegasVariant === "assigned" && (setup.players || []).length < 4 && (
            <div style={{ color: TEXT_MUTED, fontSize: 13, textAlign: "center", padding: "12px 0", marginBottom: 16 }}>
              Add 4 players in Step 3, then come back to assign teams.
            </div>
          )}

          {/* 6/6/6 preview */}
          {setup.vegasVariant === "666" && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Team Rotation Preview</div>
              {[
                { holes: "Holes 1–6",   label: "Round 1", teamA: "Player 1 + 2", teamB: "Player 3 + 4" },
                { holes: "Holes 7–12",  label: "Round 2", teamA: "Player 1 + 3", teamB: "Player 2 + 4" },
                { holes: "Holes 13–18", label: "Round 3", teamA: "Player 1 + 4", teamB: "Player 2 + 3" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                  <div>
                    <div style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>{row.holes}</div>
                    <div style={{ color: TEXT_MUTED, fontSize: 11 }}>{row.label}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: TEXT_PRIMARY, fontSize: 12 }}>🟡 {row.teamA}</div>
                    <div style={{ color: GREEN_WIN, fontSize: 12 }}>🟢 {row.teamB}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Dynamic explainer */}
          {setup.vegasVariant === "dynamic" && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>⚡ Dynamic Pairing Rules</div>
              <div style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 1.8 }}>
                <div>• <span style={{ color: TEXT_PRIMARY }}>Hole 1:</span> Default order (players 1+2 vs 3+4)</div>
                <div>• <span style={{ color: TEXT_PRIMARY }}>Each subsequent hole:</span> Scores from the previous hole determine new teams</div>
                <div>• <span style={{ color: GOLD }}>Best scorer</span> + <span style={{ color: RED_LOSS }}>Worst scorer</span> become partners</div>
                <div>• <span style={{ color: GREEN_WIN }}>2nd best</span> + <span style={{ color: TEXT_MUTED }}>3rd best</span> become partners</div>
                <div>• Ties broken by current hole order</div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── ROUND ROBIN: subtype picker ── */}
      {isRoundRobin && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Round Robin Type</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Rotating", "Wolf", "Sixes"].map(t => (
              <button key={t} onClick={() => setSetup(s => ({ ...s, rrType: t }))} style={{
                flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${setup.rrType === t ? GOLD : BORDER}`,
                background: setup.rrType === t ? `${GOLD}22` : SURFACE,
                color: setup.rrType === t ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── BANKER: method + par 3 press ── */}
      {isBanker && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Banker Method</div>
            <button style={{
              padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${GOLD}`,
              background: `${GOLD}22`, color: GOLD, cursor: "pointer", fontSize: 14, fontWeight: 700,
            }}>Select on each hole</button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Par 3 Press</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[2, 3].map(v => (
                <button key={v} onClick={() => setSetup(s => ({ ...s, par3Press: v }))} style={{
                  flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${setup.par3Press === v ? GOLD : BORDER}`,
                  background: setup.par3Press === v ? `${GOLD}22` : SURFACE,
                  color: setup.par3Press === v ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 600,
                }}>{v}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── WOLF: Lone Wolf multiplier ── */}
      {gameId === "wolf" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Lone Wolf Multiplier</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["2X", "3X", "4X"].map(m => (
              <button key={m} onClick={() => setSetup(s => ({ ...s, loneWolfMultiplier: m }))} style={{
                flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${setup.loneWolfMultiplier === m ? GOLD : BORDER}`,
                background: setup.loneWolfMultiplier === m ? `${GOLD}22` : SURFACE,
                color: setup.loneWolfMultiplier === m ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 700,
              }}>{m}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── SKINS: carry over toggle ── */}
      {gameId === "skins" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Carry Over on Tie</div>
          <Toggle
            options={[{ value: true, label: "On — Carry Over" }, { value: false, label: "Off — Void Hole" }]}
            value={setup.carryOver ?? true}
            onChange={v => setSetup(s => ({ ...s, carryOver: v }))}
          />
        </div>
      )}

      {/* ── NASSAU: separate front / back / total bets ── */}
      {gameId === "nassau" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Nassau Bet Amounts</div>
            {[["Front 9", "nassauFront"], ["Back 9", "nassauBack"], ["Overall 18", "nassauTotal"]].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 6 }}>{label}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[5, 10, 20, 30, 40, 50].map(amt => (
                    <button key={amt} onClick={() => setSetup(s => ({ ...s, [key]: amt }))} style={{
                      padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${setup[key] === amt ? GOLD : BORDER}`,
                      background: setup[key] === amt ? `${GOLD}22` : SURFACE,
                      color: setup[key] === amt ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 700,
                    }}>${amt}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Press</div>
            <Toggle
              options={[{ value: true, label: "Allow Press" }, { value: false, label: "No Press" }]}
              value={setup.nassauPress ?? false}
              onChange={v => setSetup(s => ({ ...s, nassauPress: v }))}
            />
          </div>
        </>
      )}

      {/* ── MATCH PLAY: press option ── */}
      {gameId === "match_play" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Press</div>
          <Toggle
            options={[{ value: true, label: "Allow Press" }, { value: false, label: "No Press" }]}
            value={setup.matchPress ?? false}
            onChange={v => setSetup(s => ({ ...s, matchPress: v }))}
          />
        </div>
      )}

      {/* ── 9/16/25 POINT: point values ── */}
      {gameId === "nine_sixteen_twenty_five" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Point Values (1st / 2nd / 3rd)</div>
          <Card>
            {[["1st Place", "pts1st", 9], ["2nd Place", "pts2nd", 7], ["3rd Place", "pts3rd", 5]].map(([label, key, def]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT_PRIMARY, fontSize: 14 }}>{label}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {[def, def - 1, def + 1].sort((a, b) => b - a).map(v => (
                    <button key={v} onClick={() => setSetup(s => ({ ...s, [key]: v }))} style={{
                      padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${(setup[key] ?? def) === v ? GOLD : BORDER}`,
                      background: (setup[key] ?? def) === v ? `${GOLD}22` : SURFACE,
                      color: (setup[key] ?? def) === v ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 700,
                    }}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </Card>
          <div style={{ marginTop: 12 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 6 }}>Bet Per Point</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[1, 2, 5, 10].map(amt => (
                <button key={amt} onClick={() => setSetup(s => ({ ...s, betAmount: amt }))} style={{
                  padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${setup.betAmount === amt ? GOLD : BORDER}`,
                  background: setup.betAmount === amt ? `${GOLD}22` : SURFACE,
                  color: setup.betAmount === amt ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 700,
                }}>${amt}/pt</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BET PER HOLE (not Nassau, not 9/16/25) ── */}
      {!["nassau", "nine_sixteen_twenty_five"].includes(gameId) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
            {gameId === "skins" ? "Bet Per Skin" : "Bet Per Hole"}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[5, 10, 20, 30, 40, 50].map(amt => (
              <button key={amt} onClick={() => setSetup(s => ({ ...s, betAmount: amt }))} style={{
                padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${setup.betAmount === amt ? GOLD : BORDER}`,
                background: setup.betAmount === amt ? `${GOLD}22` : SURFACE,
                color: setup.betAmount === amt ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 700,
              }}>${amt}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── MULTIPLIERS: only for skins, round robin, 2-man low ball, banker ── */}
      {["skins", "round_robin", "two_man_lowball", "banker"].includes(gameId) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Multipliers</div>
            <div style={{ display: "flex", gap: 12 }}>
              {["Gross", "Net"].map(m => (
                <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: TEXT_MUTED, fontSize: 13 }}>
                  <input type="checkbox" checked={(setup.multiplierMode || []).includes(m)} onChange={() => {
                    const curr = setup.multiplierMode || [];
                    setSetup(s => ({ ...s, multiplierMode: curr.includes(m) ? curr.filter(x => x !== m) : [...curr, m] }));
                  }} style={{ accentColor: GOLD }} />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Birdie Gross", "birdieGross"], ["Eagle Gross", "eagleGross"], ["Birdie Net", "birdieNet"], ["Eagle Net", "eagleNet"]].map(([label, key]) => (
              <div key={key}>
                <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 6 }}>{label}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["0", "2X", "3X"].map(m => (
                    <button key={m} onClick={() => setSetup(s => ({ ...s, [key]: m }))} style={{
                      flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${setup[key] === m ? GOLD : BORDER}`,
                      background: setup[key] === m ? `${GOLD}22` : SURFACE,
                      color: setup[key] === m ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    }}>{m}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HAMMER: only for wolf, banker, round robin ── */}
      {["wolf", "banker", "round_robin"].includes(gameId) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>In-Game Options</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Hammer", "Press"].map(bt => (
              <button key={bt} onClick={() => toggleBetType(bt)} style={{
                padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${(setup.betTypes || []).includes(bt) ? GOLD : BORDER}`,
                background: (setup.betTypes || []).includes(bt) ? `${GOLD}22` : SURFACE,
                color: (setup.betTypes || []).includes(bt) ? GOLD : TEXT_MUTED, cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}>{bt}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── GROSS / NET toggle: 2-man low ball & scramble ── */}
      {["two_man_lowball", "two_man_scramble"].includes(gameId) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Scoring Method</div>
          <Toggle
            options={[{ value: "gross", label: "Gross" }, { value: "net", label: "Net" }]}
            value={setup.scoringMethod || "gross"}
            onChange={v => setSetup(s => ({ ...s, scoringMethod: v }))}
          />
        </div>
      )}

      {/* ── JUNK BETS: always shown ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 15 }}>Junk Bets</div>
          <button onClick={() => setSetup(s => ({ ...s, junkBets: [] }))} style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer", fontSize: 16 }}>↺</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {JUNK_BETS.map(j => (
            <button key={j.id} onClick={() => toggleJunk(j.id)} style={{
              padding: 12, borderRadius: 10, border: `1.5px solid ${(setup.junkBets || []).includes(j.id) ? GOLD : BORDER}`,
              background: (setup.junkBets || []).includes(j.id) ? `${GOLD}22` : SURFACE,
              color: (setup.junkBets || []).includes(j.id) ? GOLD : TEXT_MUTED,
              cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "left",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              {j.name} <span style={{ fontSize: 11, opacity: 0.6 }}>ⓘ</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3InvitePlayers({ setup, setSetup }) {
  const [searchText, setSearchText] = useState("");
  const [tab, setTab] = useState("all");
  const [hcModal, setHcModal] = useState(null);

  const allPlayers = [
    { id: 1, name: "Michael W.", phone: "(972) 653-2105", hcIndex: 44, tee: "Gold" },
    { id: 2, name: "Kevin W.", phone: "(678) 283-1893", hcIndex: 18, tee: "Gold" },
    { id: 3, name: "Tyler O.", phone: "N/A", hcIndex: 12, tee: "Gold" },
    { id: 4, name: "James S.", phone: "(214) 555-0134", hcIndex: 14, tee: "Gold" },
    { id: 5, name: "Robert M.", phone: "(817) 555-0198", hcIndex: 12, tee: "Gold" },
    { id: 6, name: "David K.", phone: "(972) 555-0167", hcIndex: 14, tee: "Gold" },
  ];

  const invited = setup.players || [];
  const filtered = allPlayers.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()));

  const togglePlayer = (p) => {
    const isIn = invited.find(x => x.id === p.id);
    if (isIn) setSetup(s => ({ ...s, players: s.players.filter(x => x.id !== p.id) }));
    else { setHcModal(p); }
  };

  const confirmPlayer = (p, hcIndex) => {
    const tee = setup.tee || { color: "Gold", slope: 132, par: 71 };
    const courseHC = calcCourseHandicap(hcIndex, tee.slope, tee.rating || 74.9, tee.par, (setup.handicapPct || 100) / 100);
    setSetup(s => ({ ...s, players: [...(s.players || []), { ...p, hcIndex, courseHC, playingHC: courseHC }] }));
    setHcModal(null);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="🔍  Search players..."
          style={{ flex: 1, padding: "11px 14px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT_PRIMARY, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = BORDER}
        />
        <button style={{ padding: "11px 16px", background: `${GOLD}22`, border: `1.5px solid ${GOLD}`, borderRadius: 10, color: GOLD, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>+ Add</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ id: "invite", label: `Invited (${invited.length})` }, { id: "previous", label: "Previous" }, { id: "all", label: "All" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${tab === t.id ? GOLD : BORDER}`,
            background: tab === t.id ? `${GOLD}22` : SURFACE, color: tab === t.id ? GOLD : TEXT_MUTED,
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(tab === "invite" ? invited : filtered).map(p => {
          const isIn = !!invited.find(x => x.id === p.id);
          return (
            <Card key={p.id} onClick={() => togglePlayer(p)} style={{ background: isIn ? `${GOLD}11` : CARD_BG, border: `1px solid ${isIn ? GOLD : BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: MID_GREEN, border: `2px solid ${isIn ? GOLD : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {isIn ? "✓" : "👤"}
                  </div>
                  <div>
                    <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ color: TEXT_MUTED, fontSize: 12 }}>{p.phone}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 11 }}>H.I.</div>
                  <div style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{p.hcIndex}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {hcModal && <HandicapModal player={hcModal} setup={setup} onConfirm={confirmPlayer} onClose={() => setHcModal(null)} />}
    </div>
  );
}

function HandicapModal({ player, setup, onConfirm, onClose }) {
  const [hcIndex, setHcIndex] = useState(player.hcIndex || 0);
  const [isPlus, setIsPlus] = useState(false);
  const tee = setup.tee || { color: "Gold", slope: 132, rating: 74.9, par: 71 };
  const courseHC = calcCourseHandicap(isPlus ? -hcIndex : hcIndex, tee.slope, tee.rating, tee.par, (setup.handicapPct || 100) / 100);

  return (
    <Modal title="Handicap Settings" onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Player: {player.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", color: TEXT_MUTED, fontSize: 14 }}>
          <span>Tee</span><span style={{ color: TEXT_PRIMARY }}>{tee.color}</span>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 6 }}>Handicap Index®</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setIsPlus(!isPlus)} style={{
            padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${isPlus ? GOLD : BORDER}`,
            background: isPlus ? `${GOLD}22` : SURFACE, color: isPlus ? GOLD : TEXT_MUTED, cursor: "pointer", fontWeight: 700,
          }}>Plus</button>
          <input type="number" value={hcIndex} onChange={e => setHcIndex(Number(e.target.value))} style={{
            flex: 1, padding: 10, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
            color: TEXT_PRIMARY, fontSize: 15, textAlign: "center", outline: "none", fontFamily: "inherit",
          }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${BORDER}`, marginBottom: 8 }}>
        <span style={{ color: TEXT_MUTED }}>Course Handicap™</span>
        <span style={{ color: TEXT_PRIMARY, fontWeight: 700 }}>{courseHC}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${BORDER}`, marginBottom: 16 }}>
        <span style={{ color: TEXT_MUTED }}>Playing Handicap™</span>
        <span style={{ color: GOLD, fontWeight: 700 }}>{courseHC}</span>
      </div>
      <GoldButton onClick={() => onConfirm(player, hcIndex)}>Confirm</GoldButton>
    </Modal>
  );
}

function Step4GameLobby({ setup, setSetup }) {
  const players = setup.players || [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 17 }}>Players & Order</div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: TEXT_MUTED, fontSize: 13 }}>
          <input type="checkbox" style={{ accentColor: GOLD }} /> Off lowest Handicap
        </label>
      </div>
      {players.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: TEXT_MUTED }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
          <div>No players invited yet.<br />Go back to Step 3 to add players.</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {players.map((p, i) => (
          <Card key={p.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: TEXT_MUTED, fontSize: 18 }}>☰</span>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}44, ${MID_GREEN})`, border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <div style={{ color: TEXT_MUTED, fontSize: 12 }}>{p.phone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>P.H.™({p.playingHC || p.hcIndex})</div>
                <div style={{ color: TEXT_MUTED, fontSize: 12 }}>{setup.tee?.color || "Gold"}</div>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: GREEN_WIN, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: GREEN_WIN, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>
        <span style={{ color: TEXT_MUTED, fontSize: 13 }}>Accepted invite</span>
      </div>
    </div>
  );
}

// --- SCORECARD (Active Game) ---
function ScorecardScreen({ game, setGame, setScreen }) {
  const [view, setView] = useState("holes"); // holes | scorecard | sidebets
  const [currentHole, setCurrentHole] = useState(game?.currentHole || 1);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [scores, setScores] = useState(
    game?.players?.reduce((a, p) => ({ ...a, [p.id]: {} }), {}) || {}
  );
  const [bankerMap, setBankerMap] = useState({});

  if (!game) return null;
  const hole = HOLE_DATA[currentHole - 1];
  const players = game.players || [];

  const getScore = (playerId, holeNum) => scores[playerId]?.[holeNum] || 0;
  const setScore = (playerId, holeNum, val) => setScores(s => ({ ...s, [playerId]: { ...s[playerId], [holeNum]: Math.max(0, val) } }));

  const calcEarnings = (playerId) => {
    let total = 0;
    for (let h = 1; h <= currentHole; h++) {
      const hScores = players.map(p => ({ id: p.id, score: getScore(p.id, h) })).filter(x => x.score > 0);
      if (hScores.length < 2) continue;
      const betAmt = game.betAmount || 10;
      if (game.gameType?.id === "skins") {
        const minScore = Math.min(...hScores.map(x => x.score));
        const winners = hScores.filter(x => x.score === minScore);
        if (winners.length === 1 && winners[0].id === playerId) total += betAmt * (players.length - 1);
        else if (winners.length === 1 && winners[0].id !== playerId) total -= betAmt;
      }
    }
    return total;
  };

  const playerPayouts = players.map(p => ({ ...p, earnings: calcEarnings(p.id) }));

  return (
    <div style={{ minHeight: "100vh", background: DARK_GREEN, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: MID_GREEN, padding: "52px 0 0", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 12px" }}>
          <button onClick={() => setScreen("home")} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT_PRIMARY, cursor: "pointer" }}>←</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 15 }}>{game.gameName || game.gameType?.name}</div>
            <div style={{ color: TEXT_MUTED, fontSize: 12 }}>{game.course?.name}</div>
          </div>
          <button style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT_PRIMARY, cursor: "pointer" }}>⋮</button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex" }}>
          {[{ id: "holes", label: "Scorecard" }, { id: "sidebets", label: "Side Bets" }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              flex: 1, padding: "12px 0", border: "none", background: "transparent",
              color: view === t.id ? GOLD : TEXT_MUTED, fontWeight: view === t.id ? 700 : 500, fontSize: 14,
              borderBottom: `2px solid ${view === t.id ? GOLD : "transparent"}`, cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {view === "holes" && (
        <div>
          {/* Hole Selector Bar */}
          <div style={{ background: "#1C3428", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setScreen("scoreinput")} style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer", fontSize: 13 }}>Hole Map</button>
            <button onClick={() => {}} style={{
              background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 16px",
              color: TEXT_PRIMARY, cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8,
            }}>Hole {currentHole} ▾</button>
            <button onClick={() => setShowPayoutModal(true)} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Payouts</button>
          </div>

          {/* Scrollable Scorecard Table */}
          <div style={{ overflowX: "auto", padding: "12px 16px" }}>
            <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
              <thead>
                <tr>
                  <td style={{ padding: "8px 12px", background: "#2A4A35", color: TEXT_PRIMARY, fontWeight: 700, fontSize: 13, position: "sticky", left: 0 }}>Scorecard</td>
                  {HOLE_DATA.map(h => (
                    <td key={h.hole} onClick={() => setCurrentHole(h.hole)} style={{
                      padding: "8px 10px", background: h.hole === currentHole ? `${GOLD}33` : "#2A4A35",
                      color: h.hole === currentHole ? GOLD : TEXT_PRIMARY, fontWeight: 700, fontSize: 13,
                      textAlign: "center", cursor: "pointer", minWidth: 36,
                    }}>{h.hole}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[{ label: "Yardage", key: "yardage" }, { label: "Par", key: "par" }, { label: "Handicap", key: "handicap" }].map(row => (
                  <tr key={row.label}>
                    <td style={{ padding: "6px 12px", background: CARD_BG, color: TEXT_MUTED, fontSize: 12, position: "sticky", left: 0 }}>{row.label}</td>
                    {HOLE_DATA.map(h => (
                      <td key={h.hole} style={{ padding: "6px 8px", background: CARD_BG, color: TEXT_MUTED, fontSize: 12, textAlign: "center" }}>{h[row.key]}</td>
                    ))}
                  </tr>
                ))}
                {/* Gross Scores Header */}
                <tr>
                  <td colSpan={19} style={{ padding: "6px 12px", background: "#2A4A35", color: TEXT_PRIMARY, fontWeight: 700, fontSize: 12 }}>Gross Scores</td>
                </tr>
                {players.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: "6px 12px", background: CARD_BG, color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600, position: "sticky", left: 0, whiteSpace: "nowrap" }}>{p.name}</td>
                    {HOLE_DATA.map(h => {
                      const s = getScore(p.id, h.hole);
                      const par = h.par;
                      const color = s === 0 ? TEXT_MUTED : s < par ? GREEN_WIN : s > par ? RED_LOSS : TEXT_PRIMARY;
                      return (
                        <td key={h.hole} onClick={() => { setCurrentHole(h.hole); setShowScoreModal(true); }} style={{
                          padding: "6px 8px", background: CARD_BG, color, fontSize: 13, textAlign: "center",
                          fontWeight: 700, cursor: "pointer",
                        }}>{s || "-"}</td>
                      );
                    })}
                  </tr>
                ))}
                {/* Bets Header */}
                <tr>
                  <td colSpan={19} style={{ padding: "6px 12px", background: "#2A4A35", color: TEXT_PRIMARY, fontWeight: 700, fontSize: 12 }}>Bets</td>
                </tr>
                {players.map(p => (
                  <tr key={p.id + "_bet"}>
                    <td style={{ padding: "6px 12px", background: CARD_BG, color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600, position: "sticky", left: 0, whiteSpace: "nowrap" }}>{p.name}</td>
                    {HOLE_DATA.map(h => (
                      <td key={h.hole} style={{ padding: "6px 8px", background: CARD_BG, color: GREEN_WIN, fontSize: 12, textAlign: "center" }}>0</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "sidebets" && (
        <div style={{ padding: 20 }}>
          {(game.junkBets || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>⛳</div>
              <div style={{ color: TEXT_MUTED }}>No side bets configured</div>
              <div style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 4 }}>Add junk bets in game setup</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(game.junkBets || []).map(jid => {
                const j = JUNK_BETS.find(x => x.id === jid);
                return j ? (
                  <Card key={jid}>
                    <div style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{j.name}</div>
                    <div style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 4 }}>{j.desc}</div>
                  </Card>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Score Entry Modal */}
      {showScoreModal && (
        <Modal title={`Change Scores — Hole ${currentHole}`} onClose={() => setShowScoreModal(false)}>
          <div style={{ marginBottom: 12, color: TEXT_MUTED, fontSize: 13 }}>
            Par {hole.par} | {hole.yardage}Y | H{hole.handicap}
          </div>
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 15 }}>{p.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setScore(p.id, currentHole, getScore(p.id, currentHole) - 1)} style={{ width: 36, height: 36, borderRadius: "50%", background: `${RED_LOSS}22`, border: `1.5px solid ${RED_LOSS}`, color: RED_LOSS, cursor: "pointer", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 800, fontSize: 22, minWidth: 28, textAlign: "center" }}>{getScore(p.id, currentHole) || hole.par}</span>
                <button onClick={() => setScore(p.id, currentHole, getScore(p.id, currentHole) + 1)} style={{ width: 36, height: 36, borderRadius: "50%", background: `${GREEN_WIN}22`, border: `1.5px solid ${GREEN_WIN}`, color: GREEN_WIN, cursor: "pointer", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <GoldButton onClick={() => { setShowScoreModal(false); if (currentHole < 18) setCurrentHole(h => h + 1); }}>Save & Next Hole →</GoldButton>
          </div>
        </Modal>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <Modal title="Game Payout Summary" onClose={() => setShowPayoutModal(false)}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ color: TEXT_MUTED, fontSize: 13 }}>{game.gameName || game.gameType?.name}</div>
            <div style={{ color: TEXT_PRIMARY, fontWeight: 800, fontSize: 18 }}>
              Total Pot: ${players.reduce((sum, p) => sum + Math.abs(calcEarnings(p.id) > 0 ? calcEarnings(p.id) : 0), 0).toFixed(2)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["All Bets", "Game", "Junk"].map((t, i) => (
              <button key={t} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${i === 0 ? GOLD : BORDER}`,
                background: i === 0 ? `${GOLD}22` : "transparent", color: i === 0 ? GOLD : TEXT_MUTED,
                cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>{t}</button>
            ))}
          </div>
          {playerPayouts.map(p => (
            <Card key={p.id} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: TEXT_PRIMARY, fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: TEXT_MUTED, fontSize: 12 }}>Venmo / Cash</div>
              </div>
              <MoneyBadge amount={p.earnings} />
            </Card>
          ))}
          <div style={{ marginTop: 16 }}>
            <GoldButton onClick={() => { setShowPayoutModal(false); setScreen("home"); }}>Finish Game</GoldButton>
          </div>
        </Modal>
      )}

      <BottomNav active="games" setScreen={setScreen} />
    </div>
  );
}

// --- SCORE INPUT (Hole by Hole) ---
function ScoreInputScreen({ game, setGame, setScreen }) {
  const [currentHole, setCurrentHole] = useState(game?.currentHole || 1);
  const [scores, setScores] = useState({});
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [bankers, setBankers] = useState({});

  if (!game) return null;
  const hole = HOLE_DATA[currentHole - 1];
  const players = game.players || [];

  const getScore = (pid) => scores[pid]?.[currentHole] || hole.par;
  const setScore = (pid, val) => setScores(s => ({ ...s, [pid]: { ...(s[pid] || {}), [currentHole]: Math.max(1, val) } }));

  const earnings = (pid) => {
    const s = getScore(pid);
    const bet = game.betAmount || 10;
    const others = players.filter(p => p.id !== pid);
    if (game.gameType?.id === "skins") {
      const otherScores = others.map(p => getScore(p.id));
      if (s < Math.min(...otherScores)) return bet * others.length;
      if (s > Math.min(...otherScores)) return -bet;
    }
    return 0;
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK_GREEN, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#1C3428" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 16px 10px" }}>
          <button onClick={() => setScreen("scorecard")} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT_PRIMARY, cursor: "pointer" }}>←</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 16 }}>Game Score</div>
          </div>
          <button style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT_PRIMARY, cursor: "pointer" }}>⋮</button>
        </div>

        {/* Hole Bar */}
        <div style={{ background: "#2A4A35", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12 }}>Hole Map</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: TEXT_PRIMARY, fontWeight: 800, fontSize: 18 }}>Hole {currentHole}</div>
            <div style={{ color: TEXT_MUTED, fontSize: 12 }}>Par {hole.par} | {hole.yardage}Y | H{hole.handicap}</div>
          </div>
          <div style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>Side Bets</div>
        </div>

        {/* Game Title */}
        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <div style={{ color: RED_LOSS, fontSize: 12, fontWeight: 700 }}>Junk Bets</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 14 }}>{game.gameName || game.gameType?.name}</div>
            <div style={{ color: TEXT_MUTED, fontSize: 12 }}>{game.gameType?.name} / ${game.betAmount || 10}</div>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>ⓘ</button>
        </div>

        {game.betTypes?.includes("Hammer") && (
          <div style={{ padding: "8px 16px", display: "flex", gap: 10 }}>
            <button style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${GOLD}`, color: GOLD, background: `${GOLD}11`, cursor: "pointer", fontWeight: 700 }}>🔨 Hammer</button>
            <button style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${BORDER}`, color: TEXT_MUTED, background: SURFACE, cursor: "pointer", fontWeight: 600 }}>Press</button>
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ color: TEXT_MUTED, fontSize: 12 }}>Player</span>
        {game.gameType?.id === "banker" && <span style={{ color: TEXT_MUTED, fontSize: 12, marginRight: 60 }}>Bet</span>}
        <span style={{ color: TEXT_MUTED, fontSize: 12 }}>Score/Pops</span>
      </div>

      {/* ── VEGAS LIVE TEAM DISPLAY ── */}
      {game.gameType?.id === "vegas" && (() => {
        const vegasTeams = getVegasTeams(players, currentHole, game, scores);
        const vegasEarnings = calcVegasEarnings(players, game, scores, currentHole, game.betAmount);
        if (!vegasTeams) return null;
        const { teamA, teamB } = vegasTeams;
        const sA1 = getScore(teamA[0]?.id); const sA2 = getScore(teamA[1]?.id);
        const sB1 = getScore(teamB[0]?.id); const sB2 = getScore(teamB[1]?.id);
        const vsA = (sA1 && sA2) ? vegasTeamScore(sA1, sA2) : null;
        const vsB = (sB1 && sB2) ? vegasTeamScore(sB1, sB2) : null;
        const aWinning = vsA !== null && vsB !== null && vsA < vsB;
        const bWinning = vsA !== null && vsB !== null && vsB < vsA;
        const variant = game.vegasVariant || "assigned";

        return (
          <div style={{ margin: "8px 16px 4px" }}>
            {/* Variant badge */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <span style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 0.5 }}>
                {variant === "666" ? "🔄 6/6/6 — " + (currentHole <= 6 ? "Round 1" : currentHole <= 12 ? "Round 2" : "Round 3")
                  : variant === "dynamic" ? "⚡ Dynamic Pairing"
                  : "🤝 Assigned Teams"}
              </span>
            </div>
            {/* Team vs Team card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", marginBottom: 12 }}>
              {/* Team A */}
              <div style={{ background: aWinning ? `${GOLD}22` : CARD_BG, border: `2px solid ${aWinning ? GOLD : BORDER}`, borderRadius: 12, padding: "10px 12px", transition: "all 0.3s" }}>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }}>⛳ TEAM A</div>
                {teamA.map(p => p && (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ color: TEXT_PRIMARY, fontSize: 12, fontWeight: 600 }}>{p.name.split(" ")[0]}</span>
                    <span style={{ color: TEXT_MUTED, fontSize: 12 }}>{getScore(p.id) || "—"}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: TEXT_MUTED, fontSize: 11 }}>Score</span>
                  <span style={{ color: aWinning ? GOLD : TEXT_PRIMARY, fontWeight: 800, fontSize: 16 }}>{vsA ?? "—"}</span>
                </div>
              </div>
              {/* VS */}
              <div style={{ textAlign: "center" }}>
                <div style={{ color: TEXT_MUTED, fontWeight: 700, fontSize: 13 }}>VS</div>
                {vsA !== null && vsB !== null && (
                  <div style={{ marginTop: 4, color: vsA === vsB ? TEXT_MUTED : (aWinning ? GOLD : GREEN_WIN), fontWeight: 800, fontSize: 12 }}>
                    {vsA === vsB ? "TIE" : `${Math.abs(vsA - vsB)}pt`}
                  </div>
                )}
              </div>
              {/* Team B */}
              <div style={{ background: bWinning ? `${GREEN_WIN}22` : CARD_BG, border: `2px solid ${bWinning ? GREEN_WIN : BORDER}`, borderRadius: 12, padding: "10px 12px", transition: "all 0.3s" }}>
                <div style={{ color: GREEN_WIN, fontWeight: 700, fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }}>🏌️ TEAM B</div>
                {teamB.map(p => p && (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ color: TEXT_PRIMARY, fontSize: 12, fontWeight: 600 }}>{p.name.split(" ")[0]}</span>
                    <span style={{ color: TEXT_MUTED, fontSize: 12 }}>{getScore(p.id) || "—"}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: TEXT_MUTED, fontSize: 11 }}>Score</span>
                  <span style={{ color: bWinning ? GREEN_WIN : TEXT_PRIMARY, fontWeight: 800, fontSize: 16 }}>{vsB ?? "—"}</span>
                </div>
              </div>
            </div>
            {/* Cumulative earnings strip */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {players.map(p => (
                <div key={p.id} style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 8px", textAlign: "center", minWidth: 60 }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 10, marginBottom: 2 }}>{p.name.split(" ")[0]}</div>
                  <MoneyBadge amount={vegasEarnings[p.id] || 0} />
                </div>
              ))}
            </div>
            {/* Dynamic: show next hole pairing hint */}
            {variant === "dynamic" && currentHole < 18 && (sA1 && sA2 && sB1 && sB2) && (() => {
              const nextTeams = getVegasDynamicTeams(players, currentHole + 1, scores);
              return (
                <div style={{ marginTop: 8, background: `${GOLD}0D`, border: `1px solid ${GOLD}33`, borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ color: GOLD, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>⚡ Next Hole Teams (Hole {currentHole + 1})</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: TEXT_MUTED, fontSize: 12 }}>🟡 {nextTeams.teamA.map(p => p.name.split(" ")[0]).join(" + ")}</span>
                    <span style={{ color: TEXT_MUTED, fontSize: 12 }}>🟢 {nextTeams.teamB.map(p => p.name.split(" ")[0]).join(" + ")}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* Player Rows */}
      <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {players.map(p => {
          const s = getScore(p.id);
          const earn = earnings(p.id);
          const isBanker = game.gameType?.id === "banker" && bankers[currentHole] === p.id;
          // For Vegas: highlight team membership
          const vegasTeams = game.gameType?.id === "vegas" ? getVegasTeams(players, currentHole, game, scores) : null;
          const inTeamA = vegasTeams?.teamA?.find(tp => tp?.id === p.id);
          const inTeamB = vegasTeams?.teamB?.find(tp => tp?.id === p.id);
          const teamColor = inTeamA ? GOLD : inTeamB ? GREEN_WIN : null;

          return (
            <Card key={p.id} style={{
              background: isBanker ? `${GOLD}11` : teamColor ? `${teamColor}0D` : CARD_BG,
              border: `1px solid ${teamColor ? teamColor + "55" : BORDER}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {teamColor && <div style={{ width: 8, height: 8, borderRadius: "50%", background: teamColor, flexShrink: 0 }} />}
                    <span style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                    {teamColor && <span style={{ fontSize: 10, color: teamColor, fontWeight: 700, marginLeft: 2 }}>TEAM {inTeamA ? "A" : "B"}</span>}
                  </div>
                  <div style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                    <span style={{ color: TEXT_MUTED }}>Earnings:</span>
                    <MoneyBadge amount={earn} />
                  </div>
                  <div style={{ color: TEXT_MUTED, fontSize: 12 }}>PH({p.playingHC || p.hcIndex})</div>
                </div>
                {game.gameType?.id === "banker" && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginRight: 12 }}>
                    <button onClick={() => setBankers(b => ({ ...b, [currentHole]: b[currentHole] === p.id ? null : p.id }))} style={{
                      padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${isBanker ? GOLD : BORDER}`,
                      background: isBanker ? `${GOLD}22` : SURFACE, color: isBanker ? GOLD : TEXT_MUTED,
                      cursor: "pointer", fontWeight: 700, fontSize: 13,
                    }}>{isBanker ? "Banker ✓" : (game.betAmount || 10)}</button>
                    <button style={{ padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${BORDER}`, background: SURFACE, color: TEXT_MUTED, cursor: "pointer", fontSize: 12 }}>Press</button>
                  </div>
                )}
                <button onClick={() => setShowScoreModal(true)} style={{
                  width: 52, height: 52, borderRadius: 12, background: SURFACE,
                  border: `1.5px solid ${teamColor || BORDER}`,
                  color: TEXT_PRIMARY, fontWeight: 800, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>{s}</button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Prev / Next */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "12px 16px 24px", background: DARK_GREEN, borderTop: `1px solid ${BORDER}`, display: "flex", gap: 12 }}>
        <GoldButton variant="secondary" onClick={() => setCurrentHole(h => Math.max(1, h - 1))} disabled={currentHole === 1}>← Prev Hole</GoldButton>
        <GoldButton onClick={() => { if (currentHole < 18) setCurrentHole(h => h + 1); else setScreen("scorecard"); }}>
          {currentHole < 18 ? "Next Hole →" : "Finish Round"}
        </GoldButton>
      </div>
      <div style={{ height: 90 }} />

      {showScoreModal && (
        <Modal title={`Scores — Hole ${currentHole}`} onClose={() => setShowScoreModal(false)}>
          <div style={{ marginBottom: 12, color: TEXT_MUTED, fontSize: 13 }}>Par {hole.par} | {hole.yardage}Y</div>
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT_PRIMARY, fontWeight: 700 }}>{p.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setScore(p.id, getScore(p.id) - 1)} style={{ width: 36, height: 36, borderRadius: "50%", background: `${RED_LOSS}22`, border: `1.5px solid ${RED_LOSS}`, color: RED_LOSS, cursor: "pointer", fontSize: 20, fontWeight: 700 }}>−</button>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 800, fontSize: 22, minWidth: 28, textAlign: "center" }}>{getScore(p.id)}</span>
                <button onClick={() => setScore(p.id, getScore(p.id) + 1)} style={{ width: 36, height: 36, borderRadius: "50%", background: `${GREEN_WIN}22`, border: `1.5px solid ${GREEN_WIN}`, color: GREEN_WIN, cursor: "pointer", fontSize: 20, fontWeight: 700 }}>+</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <GoldButton onClick={() => setShowScoreModal(false)}>Done</GoldButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- HISTORY ---
function HistoryScreen({ setScreen }) {
  const sampleGames = [
    { id: 1, name: "Michael W.'s Banker Game", course: "Buffalo Creek Golf Club", date: "05/11/2026", type: "Banker", players: 3, result: "+$45.00", isPos: true },
    { id: 2, name: "Kevin's Wolf Game", course: "Rockwall Golf & Athletic Club", date: "04/28/2026", type: "Wolf", players: 4, result: "-$30.00", isPos: false },
    { id: 3, name: "Skins Saturday", course: "Waterview Golf Club", date: "04/20/2026", type: "Skins", players: 4, result: "+$80.00", isPos: true },
    { id: 4, name: "Nassau Sunday", course: "Woodbridge Golf Club", date: "04/14/2026", type: "Nassau", players: 2, result: "-$20.00", isPos: false },
  ];

  return (
    <div style={{ minHeight: "100vh", background: DARK_GREEN, paddingBottom: 80 }}>
      <div style={{ background: MID_GREEN, padding: "52px 20px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <Logo size={32} />
        <h1 style={{ color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "12px 0 0" }}>Game History</h1>
      </div>

      {/* Stats Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: BORDER, margin: "0 0 16px" }}>
        {[{ label: "Games Played", value: "24" }, { label: "All-Time Earnings", value: "+$340" }, { label: "Win Rate", value: "62%" }].map(s => (
          <div key={s.label} style={{ background: CARD_BG, padding: "16px 12px", textAlign: "center" }}>
            <div style={{ color: GOLD, fontWeight: 800, fontSize: 20 }}>{s.value}</div>
            <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sampleGames.map(g => (
            <Card key={g.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 15 }}>{g.name}</div>
                  <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>{g.course}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <span style={{ background: `${GOLD}22`, color: GOLD, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{g.type}</span>
                    <span style={{ color: TEXT_MUTED, fontSize: 12 }}>👥 {g.players} players</span>
                    <span style={{ color: TEXT_MUTED, fontSize: 12 }}>📅 {g.date}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: g.isPos ? GREEN_WIN : RED_LOSS, fontWeight: 800, fontSize: 18, textShadow: g.isPos ? `0 0 8px ${GREEN_WIN}66` : `0 0 8px ${RED_LOSS}66` }}>{g.result}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav active="history" setScreen={setScreen} />
    </div>
  );
}

// --- SETTINGS ---
function SettingsScreen({ setScreen }) {
  const [name, setName] = useState("Michael Wells");
  const [handicap, setHandicap] = useState("44");

  return (
    <div style={{ minHeight: "100vh", background: DARK_GREEN, paddingBottom: 80 }}>
      <div style={{ background: MID_GREEN, padding: "52px 20px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <Logo size={32} />
        <h1 style={{ color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "12px 0 0" }}>Settings</h1>
      </div>

      <div style={{ padding: 20 }}>
        {/* Profile */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Profile</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}44, ${MID_GREEN})`, border: `3px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏌️</div>
            <div>
              <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 17 }}>{name}</div>
              <div style={{ color: TEXT_MUTED, fontSize: 13 }}>H.I. {handicap}</div>
            </div>
          </div>
          <Input label="Display Name" value={name} onChange={setName} />
          <Input label="Handicap Index" value={handicap} onChange={setHandicap} type="number" />
        </div>

        {/* Payment */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Payment Preference</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["Venmo", "Cash App", "PayPal", "Cash"].map(m => (
              <button key={m} style={{
                padding: 12, borderRadius: 10, border: `1.5px solid ${m === "Venmo" ? GOLD : BORDER}`,
                background: m === "Venmo" ? `${GOLD}22` : SURFACE, color: m === "Venmo" ? GOLD : TEXT_MUTED,
                cursor: "pointer", fontWeight: 600, fontSize: 14,
              }}>{m}</button>
            ))}
          </div>
        </div>

        {/* App Settings */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>App Settings</div>
          <Card>
            {[{ label: "Push Notifications", icon: "🔔" }, { label: "Location Services", icon: "📍" }, { label: "USGA Integration", icon: "🏅" }, { label: "Privacy Policy", icon: "🔒" }, { label: "Terms of Service", icon: "📄" }].map((item, i, arr) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span>{item.icon}</span>
                  <span style={{ color: TEXT_PRIMARY, fontSize: 15 }}>{item.label}</span>
                </div>
                <span style={{ color: TEXT_MUTED }}>›</span>
              </div>
            ))}
          </Card>
        </div>

        <GoldButton variant="danger">Sign Out</GoldButton>
      </div>
      <BottomNav active="settings" setScreen={setScreen} />
    </div>
  );
}

// --- MY GAMES ---
function MyGamesScreen({ setScreen, setActiveGame, activeGame }) {
  return (
    <div style={{ minHeight: "100vh", background: DARK_GREEN, paddingBottom: 80 }}>
      <div style={{ background: MID_GREEN, padding: "52px 20px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <Logo size={32} />
        <h1 style={{ color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "12px 0 0" }}>My Games</h1>
      </div>
      <div style={{ padding: 20 }}>
        {activeGame ? (
          <>
            <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Active Game</div>
            <Card onClick={() => setScreen("scoreinput")} style={{ borderColor: GOLD, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{activeGame.gameName || activeGame.gameType?.name}</div>
                  <div style={{ color: TEXT_MUTED, fontSize: 13 }}>{activeGame.course?.name}</div>
                  <div style={{ color: GREEN_WIN, fontSize: 12, marginTop: 4 }}>● LIVE</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: TEXT_MUTED, fontSize: 12 }}>Hole {activeGame.currentHole}/18</div>
                  <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>{activeGame.players?.length || 0} players</div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⛳</div>
            <div style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 17, marginBottom: 8 }}>No active game</div>
            <div style={{ color: TEXT_MUTED, fontSize: 14, marginBottom: 24 }}>Head to Home to start a new game</div>
            <GoldButton onClick={() => setScreen("home")} style={{ maxWidth: 200, margin: "0 auto" }}>Start a Game</GoldButton>
          </div>
        )}
      </div>
      <BottomNav active="games" setScreen={setScreen} />
    </div>
  );
}

// --- MODAL ---
function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif", fontSize: 20, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, width: 30, height: 30, color: TEXT_MUTED, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [gameSetup, setGameSetup] = useState({
    holes: 18, startingHole: 1, handicapPct: 100,
    betTypes: [], junkBets: [], players: [], betAmount: 10,
    birdieGross: "2X", eagleGross: "3X",
  });
  const [activeGame, setActiveGame] = useState(null);

  const screenMap = {
    splash: <SplashScreen onContinue={() => setScreen("auth")} />,
    auth: <AuthScreen onLogin={() => setScreen("home")} />,
    home: <HomeScreen setScreen={setScreen} setGameSetup={setGameSetup} />,
    game_setup: <GameSetupScreen setup={gameSetup} setSetup={setGameSetup} setScreen={setScreen} setActiveGame={(g) => { setActiveGame(g); setScreen("scoreinput"); }} />,
    scorecard: <ScorecardScreen game={activeGame} setGame={setActiveGame} setScreen={setScreen} />,
    scoreinput: <ScoreInputScreen game={activeGame} setGame={setActiveGame} setScreen={setScreen} />,
    history: <HistoryScreen setScreen={setScreen} />,
    settings: <SettingsScreen setScreen={setScreen} />,
    games: <MyGamesScreen setScreen={setScreen} setActiveGame={setActiveGame} activeGame={activeGame} />,
  };

  return (
    <div style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: DARK_GREEN, fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: #8BA898; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2A4A35; border-radius: 2px; }
        button { font-family: 'DM Sans', sans-serif; }
      `}</style>
      {screenMap[screen] || screenMap.home}
    </div>
  );
}
