import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";

const API = "https://classroom-live-poll.curse-beet.workers.dev";
const PALETTE = [["黑", "#111827"], ["紅", "#ef4444"], ["藍", "#2563eb"], ["綠", "#16a34a"], ["橘", "#f97316"], ["紫", "#9333ea"], ["粉", "#ec4899"], ["棕", "#92400e"]];
const WIDTHS = [["細", .006], ["中", .014], ["粗", .026]];
const GROUPS = "ABCDEFGH".split("");
const pin = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const canvasId = (mode, seat, group) => mode === "ALL" ? "all" : mode === "GROUP" ? `group-${group}` : `student-${seat}`;
const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const cleanNumber = (value, max) => Math.max(0, Math.min(max, Number(value) || 0));

function paint(ctx, strokes, w, h) {
  strokes.forEach(stroke => {
    if (stroke.type === "text" || stroke.type === "stamp") {
      ctx.font = `${stroke.type === "stamp" ? 44 : 28}px sans-serif`;
      ctx.fillStyle = stroke.type === "stamp" ? "#ef4444" : "#b91c1c";
      ctx.fillText(stroke.text, stroke.x * w, stroke.y * h);
      return;
    }
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * Math.min(w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    stroke.points.forEach((point, index) => index ? ctx.lineTo(point.x * w, point.y * h) : ctx.moveTo(point.x * w, point.y * h));
    ctx.stroke();
  });
}

function draw(canvas, strokes, background) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const done = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); paint(ctx, strokes, canvas.width, canvas.height); };
  if (!background) return done();
  const image = new Image();
  image.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); paint(ctx, strokes, canvas.width, canvas.height); };
  image.src = background;
}

function hit(strokes, point) {
  return strokes.find(stroke => stroke.points?.some(dot => Math.hypot((dot.x - point.x) * 1.45, dot.y - point.y) <= Math.max(.018, stroke.width * 1.7)));
}

function Board({ strokes, bg, onStroke, onErase, onTap, erasableStrokes = strokes, erasing = false, overlay = false, passThrough = false, previewColor = "#13213f", previewWidth = .012 }) {
  const ref = useRef();
  const points = useRef([]);
  const down = useRef(false);
  const erased = useRef(new Set());
  const last = useRef(0);
  const preview = () => {
    if (points.current.length > 1) paint(ref.current.getContext("2d"), [{ points: points.current, color: previewColor, width: previewWidth }], ref.current.width, ref.current.height);
  };
  useEffect(() => { draw(ref.current, strokes, bg); if (points.current.length > 1) setTimeout(preview, 0); }, [strokes, bg]);
  const position = event => {
    const box = ref.current.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)), y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)) };
  };
  const erase = event => {
    const stroke = hit(erasableStrokes, position(event));
    if (stroke && !erased.current.has(stroke.id)) { erased.current.add(stroke.id); onErase?.(stroke.id); }
  };
  const end = event => {
    if (!down.current) return;
    down.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (onTap) onTap(position(event));
    else if (!erasing && points.current.length > 1) onStroke?.(points.current);
    points.current = [];
  };
  return <canvas ref={ref} width="1000" height="650" className={`touch-none w-full rounded-3xl ${overlay ? "absolute inset-0 h-full bg-transparent shadow-none" : "bg-white shadow-2xl"} ${passThrough ? "pointer-events-none" : ""} ${erasing ? "cursor-cell" : onStroke || onTap ? "cursor-crosshair" : "cursor-default"}`}
    onPointerDown={event => { if (!onStroke && !onErase && !onTap) return; event.currentTarget.setPointerCapture?.(event.pointerId); down.current = true; erased.current.clear(); if (erasing) erase(event); else { points.current = [position(event)]; last.current = performance.now(); } }}
    onPointerMove={event => { if (!down.current) return; if (erasing) return erase(event); if (!onTap && performance.now() - last.current >= 12) { points.current.push(position(event)); last.current = performance.now(); preview(); } }}
    onPointerUp={end} onPointerCancel={end} />;
}

function useRoom(code, role, seat, group, teacherPassword = "") {
  const [state, setState] = useState(null);
  const [lastStroke, setLastStroke] = useState(null);
  const [send, setSend] = useState(() => () => {});
  useEffect(() => {
    if (!code) return;
    const ws = new WebSocket(API.replace(/^http/, "ws") + `/classroom/${code}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ event: "join", data: { role, seat, group, teacherPassword } }));
      setSend(() => (event, data) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ event, data })));
    };
    ws.onmessage = event => {
      const message = JSON.parse(event.data), data = message.data;
      if (message.event === "state") setState(data);
      if (message.event === "students") setState(old => old ? { ...old, students: data } : old);
      if (message.event === "board:stroke") setLastStroke(data), setState(old => old ? { ...old, whiteboard: { ...old.whiteboard, strokes: { ...old.whiteboard.strokes, [data.canvasId]: [...(old.whiteboard.strokes[data.canvasId] || []), data.stroke] } } } : old);
      if (message.event === "board:erase") setState(old => old ? { ...old, whiteboard: { ...old.whiteboard, strokes: { ...old.whiteboard.strokes, [data.canvasId]: (old.whiteboard.strokes[data.canvasId] || []).filter(stroke => stroke.id !== data.strokeId) } } } : old);
      if (message.event === "board:clear") setState(old => old ? { ...old, whiteboard: { ...old.whiteboard, strokes: { ...old.whiteboard.strokes, [data.canvasId]: (old.whiteboard.strokes[data.canvasId] || []).filter(stroke => stroke.author !== data.author) } } } : old);
      if (message.event === "board:feedback") setState(old => old ? { ...old, whiteboard: { ...old.whiteboard, feedback: { ...old.whiteboard.feedback, [data.canvasId]: [...(old.whiteboard.feedback[data.canvasId] || []), data.mark] } } } : old);
      if (message.event === "board:feedback-clear") setState(old => old ? { ...old, whiteboard: { ...old.whiteboard, feedback: { ...old.whiteboard.feedback, [data.canvasId]: [] } } } : old);
    };
    return () => ws.close();
  }, [code, role, seat, group, teacherPassword]);
  return [state, lastStroke, send];
}

function Teacher({ teacherPassword }) {
  const [code, setCode] = useState("");
  const [mode, setMode] = useState("ALL");
  const [groupCount, setGroupCount] = useState(3);
  const [chosen, setChosen] = useState("all");
  const [tool, setTool] = useState("pen");
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [state, , send] = useRoom(code, "teacher", "teacher", "A", teacherPassword);
  const activeMode = state?.mode || mode;
  const activeGroups = state?.groupCount || groupCount;
  const boards = state?.whiteboard?.strokes || {};
  const feedbacks = state?.whiteboard?.feedback || {};
  const studentIds = Object.keys(state?.students || {}).map(seat => `student-${seat}`);
  const groupIds = GROUPS.slice(0, activeGroups).map(group => `group-${group}`);
  const ids = activeMode === "ALL" ? ["all"] : activeMode === "GROUP" ? groupIds : studentIds;
  const active = boards[chosen] || [];
  const feedback = feedbacks[chosen] || [];
  const duration = Math.max(5, minutes * 60 + seconds);
  useEffect(() => { if (code) send("board:configure", { mode, groupCount }); }, [code, send]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setRemaining(value => { if (value <= 1) { clearInterval(timer); setRunning(false); return 0; } return value - 1; }), 1000);
    return () => clearInterval(timer);
  }, [running]);
  const configure = (nextMode = mode, nextGroups = groupCount) => {
    setMode(nextMode); setGroupCount(nextGroups);
    setChosen(nextMode === "ALL" ? "all" : nextMode === "GROUP" ? "group-A" : studentIds[0] || "all");
    send("board:configure", { mode: nextMode, groupCount: nextGroups });
  };
  const changeMinutes = value => { const next = cleanNumber(value, 119); setMinutes(next); if (!running) setRemaining(Math.max(5, next * 60 + seconds)); };
  const changeSeconds = value => { const next = cleanNumber(value, 59); setSeconds(next); if (!running) setRemaining(Math.max(5, minutes * 60 + next)); };
  const upload = file => { if (!file) return; const reader = new FileReader(); reader.onload = () => send("board:background", { image: reader.result }); reader.readAsDataURL(file); };
  const addMark = point => {
    if (tool === "pen" || tool === "erase") return;
    const text = tool === "text" ? prompt("輸入給學生的文字評語") || "" : tool;
    if (text) send("board:feedback", { canvasId: chosen, mark: { type: tool === "text" ? "text" : "stamp", text, ...point } });
  };
  const modeButtons = <>{[["ALL", "全班共畫"], ["INDIVIDUAL", "個別作答"], ["GROUP", "分組協作"]].map(([value, label]) => <button key={value} onClick={() => code ? configure(value) : setMode(value)} className={`rounded-xl px-4 py-2 font-black ${activeMode === value ? "bg-fuchsia-500 text-white" : "bg-sky-50 text-slate-700"}`}>{label}</button>)}</>;
  if (!code) return <main className="min-h-screen p-5 text-slate-800"><div className="mx-auto max-w-2xl rounded-3xl bg-white/90 p-7 shadow-2xl"><h1 className="text-3xl font-black">🖍️ 建立多模式白板教室</h1><p className="mt-2 text-slate-600">請先設定學生登入後的作答畫面。</p><div className="mt-6 flex flex-wrap gap-3">{modeButtons}</div>{mode === "GROUP" && <label className="mt-5 block font-black">分組數量<select value={groupCount} onChange={event => setGroupCount(Number(event.target.value))} className="ml-3 rounded-xl border p-3">{[2, 3, 4, 5, 6, 7, 8].map(count => <option key={count} value={count}>{count} 組</option>)}</select></label>}<button onClick={() => setCode(pin())} className="mt-7 rounded-2xl bg-cyan-400 px-6 py-4 text-xl font-black text-slate-900">依此設定建立教室</button></div></main>;
  return <main className="min-h-screen p-5 text-slate-800"><div className="mx-auto max-w-6xl"><h1 className="text-3xl font-black">🖍️ 星光多模式白板</h1><p className="mt-4 rounded-xl bg-white/80 p-3 shadow-sm">學生 PIN：<b className="text-cyan-700">{code}</b>　連結：{location.origin + location.pathname + `?pin=${code}`}</p>
    <section className="mt-4 rounded-2xl bg-white/85 p-4 shadow-sm"><h2 className="font-black">學生端呈現模式</h2><div className="mt-2 flex flex-wrap gap-2">{modeButtons}{activeMode === "GROUP" && <label className="rounded-xl bg-sky-50 px-3 py-2 font-black">分成<select value={activeGroups} onChange={event => configure("GROUP", Number(event.target.value))} className="ml-2 rounded-lg bg-white p-1">{[2, 3, 4, 5, 6, 7, 8].map(count => <option key={count} value={count}>{count}</option>)}</select>組</label>}<label className="rounded-xl bg-amber-300 px-4 py-2 font-black text-slate-900">一鍵派發題目底圖<input hidden type="file" accept="image/*" onChange={event => upload(event.target.files[0])} /></label></div></section>
    <section className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/85 p-4 shadow-sm"><b>⏱️ 作答計時器</b><label className="font-bold">分<input aria-label="倒數分鐘" type="number" min="0" max="119" value={minutes} onChange={event => changeMinutes(event.target.value)} className="ml-2 w-20 rounded-xl border p-2" /></label><label className="font-bold">秒<input aria-label="倒數秒數" type="number" min="0" max="59" value={seconds} onChange={event => changeSeconds(event.target.value)} className="ml-2 w-20 rounded-xl border p-2" /></label><span>目前 {clock(remaining)}</span><button onClick={() => { if (!remaining) setRemaining(duration); setRunning(value => !value); }} className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-900">{running ? "暫停" : "開始"}</button><button onClick={() => { setRunning(false); setRemaining(duration); }} className="rounded-xl bg-sky-50 px-4 py-2 font-black">重設</button></section>
    <div className="mt-5 grid gap-4 lg:grid-cols-[245px_1fr]"><aside className="rounded-2xl bg-white/85 p-3 shadow-sm"><h2 className="font-black">縮圖巡視</h2>{ids.length ? ids.map(id => <button key={id} onClick={() => setChosen(id)} className={`mt-2 w-full rounded-xl p-2 text-left ${chosen === id ? "bg-cyan-400 text-slate-900" : "bg-sky-50 text-slate-700"}`}>{id.replace("student-", "座號 ").replace("group-", "第 ")}</button>) : <p className="mt-3 text-sm text-slate-500">等待學生加入後顯示畫布。</p>}<button onClick={() => alert(`已投放 ${chosen}，請將此畫布投影到大螢幕。`)} className="mt-4 w-full rounded-xl bg-fuchsia-500 p-3 font-black text-white">📽 投放目前畫布</button>
      <section className="mt-4 rounded-2xl bg-rose-50 p-3"><h2 className="font-black text-rose-700">教師批改與擦布</h2><button onClick={() => setTool("pen")} className={`mt-2 w-full rounded-xl p-2 font-black ${tool === "pen" ? "bg-rose-500 text-white" : "bg-white"}`}>🔴 教師紅筆</button><button onClick={() => setTool("erase")} className={`mt-2 w-full rounded-xl p-2 font-black ${tool === "erase" ? "bg-sky-500 text-white" : "bg-white"}`}>🧽 擦布（指定學生筆跡）</button><p className="mt-1 text-xs text-slate-600">選取擦布後，點碰任一筆跡即可只擦除那一筆。</p><button onClick={() => setTool("text")} className={`mt-2 w-full rounded-xl p-2 font-black ${tool === "text" ? "bg-rose-500 text-white" : "bg-white"}`}>✏️ 文字評語</button>{["太棒了 ⭐", "好創意 💡", "再想一想 🤔", "100分 💯"].map(stamp => <button key={stamp} onClick={() => setTool(stamp)} className={`mt-2 w-full rounded-xl p-2 text-sm font-black ${tool === stamp ? "bg-amber-300" : "bg-white"}`}>{stamp}</button>)}<button onClick={() => confirm("只會清除教師批改，保留學生作答。確定繼續？") && send("board:feedback-clear", { canvasId: chosen })} className="mt-3 w-full rounded-xl bg-sky-50 p-2 font-black">清除教師批改</button></section></aside>
      <section><div className="relative"><Board strokes={active} bg={state?.whiteboard?.background} erasing={tool === "erase"} onErase={tool === "erase" ? strokeId => send("board:teacher-erase", { canvasId: chosen, strokeId }) : undefined} /><Board strokes={feedback} overlay passThrough={tool === "erase"} previewColor="#ef4444" onStroke={tool === "pen" ? points => send("board:feedback", { canvasId: chosen, mark: { type: "stroke", points } }) : undefined} onTap={tool === "pen" || tool === "erase" ? undefined : addMark} /></div><p className="mt-2 text-slate-600">學生筆跡在底層；教師批改在上層，可獨立清除。擦布只會移除點到的學生單一筆跡。</p></section></div></div></main>;
}

function Tools({ color, setColor, width, setWidth, highlighter, setHighlighter, erasing, setErasing, onUndo, onRedo, canUndo, canRedo, onClear }) {
  return <section className="mb-4 rounded-3xl bg-white p-3 text-slate-800 shadow-xl"><div className="flex flex-wrap items-center gap-3"><div className="flex gap-1">{PALETTE.map(([name, value]) => <button key={value} title={name} onClick={() => { setColor(value); setErasing(false); }} className={`h-9 w-9 rounded-full border-4 shadow-sm ${color === value && !erasing ? "border-slate-800" : "border-white"}`} style={{ backgroundColor: value }} />)}</div><div className="flex rounded-2xl bg-slate-100 p-1">{WIDTHS.map(([name, value]) => <button key={name} onClick={() => setWidth(value)} className={`rounded-xl px-3 py-2 text-sm font-black ${width === value ? "bg-indigo-600 text-white" : "text-slate-600"}`}>{name}</button>)}</div><button onClick={() => { setHighlighter(value => !value); setErasing(false); }} className={`rounded-2xl px-3 py-2 text-sm font-black ${highlighter ? "bg-amber-300 text-slate-900" : "bg-amber-50 text-amber-800"}`}>🖍 螢光筆</button><button onClick={() => setErasing(value => !value)} className={`rounded-2xl px-3 py-2 text-sm font-black ${erasing ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700"}`}>🧼 整筆橡皮擦</button><div className="ml-auto flex gap-2"><button disabled={!canUndo} onClick={onUndo} className="rounded-2xl bg-slate-200 px-3 py-2 text-sm font-black disabled:opacity-40">↶ 上一步</button><button disabled={!canRedo} onClick={onRedo} className="rounded-2xl bg-slate-200 px-3 py-2 text-sm font-black disabled:opacity-40">↷ 下一步</button><button onClick={onClear} className="rounded-2xl bg-sky-50 px-3 py-2 text-sm font-black">清空我的筆跡</button></div></div></section>;
}

function Student() {
  const preset = new URLSearchParams(location.search).get("pin") || "";
  const [code, setCode] = useState(preset), [seat, setSeat] = useState(sessionStorage.getItem("wb-seat") || ""), [group, setGroup] = useState("A"), [info, setInfo] = useState(null), [checking, setChecking] = useState(false), [joined, setJoined] = useState(false), [color, setColor] = useState(PALETTE[0][1]), [width, setWidth] = useState(WIDTHS[1][1]), [highlighter, setHighlighter] = useState(false), [erasing, setErasing] = useState(false), [undoStack, setUndoStack] = useState([]), [redoStack, setRedoStack] = useState([]), [pendingStrokes, setPendingStrokes] = useState([]), [reward, setReward] = useState("");
  const pending = useRef(new Map()), seenReward = useRef("");
  const [state, lastStroke, send] = useRoom(joined ? code : "", "student", seat, group);
  const mode = state?.mode || info?.mode || "ALL";
  const id = canvasId(mode, seat, group);
  const strokes = state?.whiteboard?.strokes?.[id] || [], feedback = state?.whiteboard?.feedback?.[id] || [];
  const visible = [...strokes, ...feedback, ...pendingStrokes];
  const groups = GROUPS.slice(0, info?.groupCount || state?.groupCount || 3);
  const inspect = async () => {
    if (!code || !seat) return alert("請輸入 PIN 與座號／姓名");
    setChecking(true);
    try { const response = await fetch(`${API}/classroom/${code}?info=1`); if (!response.ok) throw Error(); setInfo(await response.json()); }
    catch { alert("找不到教室，請確認 PIN 後再試一次。"); }
    finally { setChecking(false); }
  };
  useEffect(() => { if (!lastStroke || lastStroke.canvasId !== id || lastStroke.author !== seat) return; setPendingStrokes(items => items.filter(stroke => stroke.clientId !== lastStroke.clientId)); const action = pending.current.get(lastStroke.clientId); if (!action) return; pending.current.delete(lastStroke.clientId); setUndoStack(items => [...items, { stroke: lastStroke.stroke }]); if (action === "draw") setRedoStack([]); }, [lastStroke, id, seat]);
  useEffect(() => { const newest = feedback.at(-1); if (!newest || newest.type !== "stamp" || newest.id === seenReward.current) return; seenReward.current = newest.id; setReward(newest.text); const timer = setTimeout(() => setReward(""), 2600); return () => clearTimeout(timer); }, [feedback]);
  const add = (points, replay = false) => { const clientId = crypto.randomUUID(), ink = highlighter ? `${color}80` : color; pending.current.set(clientId, replay ? "redo" : "draw"); setPendingStrokes(items => [...items, { id: `local-${clientId}`, clientId, author: seat, points, color: ink, width }]); send("board:stroke", { canvasId: id, points, color: ink, width, clientId }); };
  const undo = () => { const action = undoStack.at(-1); if (!action) return; setUndoStack(items => items.slice(0, -1)); setRedoStack(items => [...items, action]); send("board:erase", { canvasId: id, strokeId: action.stroke.id }); };
  const redo = () => { const action = redoStack.at(-1); if (!action) return; setRedoStack(items => items.slice(0, -1)); add(action.stroke.points, true); };
  const clear = () => { if (!confirm("確定要清空自己的筆跡嗎？")) return; setUndoStack([]); setRedoStack([]); setPendingStrokes([]); send("board:clear", { canvasId: id }); };
  if (!joined) return <main className="grid min-h-screen place-items-center p-6"><div className="w-full max-w-md rounded-3xl bg-white p-7 text-slate-900 shadow-2xl"><h1 className="text-3xl font-black">加入互動白板</h1>{!info ? <><input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="6 碼 PIN" className="mt-5 w-full rounded-xl border p-4" /><input value={seat} onChange={event => setSeat(event.target.value)} placeholder="座號／姓名" className="mt-3 w-full rounded-xl border p-4" /><button onClick={inspect} disabled={checking} className="mt-4 w-full rounded-xl bg-indigo-600 p-4 font-black text-white">{checking ? "確認教室中…" : "確認教室"}</button></> : <><p className="mt-5 rounded-xl bg-sky-50 p-4 font-bold">教室模式：{mode === "ALL" ? "全班共畫" : mode === "GROUP" ? "分組協作" : "個別作答"}</p>{mode === "GROUP" && <label className="mt-4 block font-black">選擇我的組別<select value={group} onChange={event => setGroup(event.target.value)} className="mt-2 w-full rounded-xl border p-4">{groups.map(value => <option key={value} value={value}>第 {value} 組</option>)}</select></label>}<button onClick={() => { sessionStorage.setItem("wb-seat", seat); setJoined(true); }} className="mt-4 w-full rounded-xl bg-indigo-600 p-4 font-black text-white">進入我的作答白板</button></>}</div></main>;
  if (!state) return <main className="grid min-h-screen place-items-center"><div className="rounded-3xl bg-white p-7 text-xl font-black text-slate-800 shadow-xl">正在載入我的白板…</div></main>;
  return <main className="min-h-screen p-5 text-slate-800"><div className="mx-auto max-w-4xl"><p className="mb-3 font-black text-sky-800">{mode === "ALL" ? "全班共畫" : mode === "GROUP" ? `第 ${group} 組協作` : "個別作答"}・只能操作自己的畫布</p><Tools color={color} setColor={setColor} width={width} setWidth={setWidth} highlighter={highlighter} setHighlighter={setHighlighter} erasing={erasing} setErasing={setErasing} onUndo={undo} onRedo={redo} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0} onClear={clear} /><div className="relative"><Board strokes={visible} bg={state.whiteboard?.background} erasing={erasing} previewColor={highlighter ? `${color}80` : color} previewWidth={width} onStroke={add} onErase={strokeId => send("board:erase", { canvasId: id, strokeId })} />{reward && <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="animate-bounce rounded-3xl bg-amber-300 px-7 py-5 text-3xl font-black text-slate-900 shadow-2xl">{reward}</div></div>}</div></div></main>;
}

function HomeLink() { return <a href="../" className="fixed left-4 top-4 z-50 rounded-xl bg-white/90 px-3 py-2 text-sm font-black text-slate-800 shadow-lg">← 返回教學工具箱</a>; }
function App() {
  const [role, setRole] = useState(new URLSearchParams(location.search).get("pin") ? "student" : "");
  const [showLogin, setShowLogin] = useState(false), [password, setPassword] = useState("");
  const login = event => { event.preventDefault(); if (password === "teacher123") { setPassword(""); setRole("teacher"); } else alert("教師密碼不正確"); };
  if (!role) return <main className="grid min-h-screen place-items-center text-slate-800"><div className="rounded-3xl bg-white/90 p-8 text-center shadow-2xl"><h1 className="text-4xl font-black">星光互動白板</h1>{showLogin ? <form onSubmit={login} className="mt-6"><label className="block text-left font-black">教師密碼<input autoFocus type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="輸入教師密碼" className="mt-2 w-full rounded-xl border p-3" /></label><button className="mt-4 w-full rounded-xl bg-fuchsia-500 px-5 py-3 font-black text-white">進入教師端</button><button type="button" onClick={() => { setPassword(""); setShowLogin(false); }} className="mt-2 text-sm text-slate-500">取消</button></form> : <><button onClick={() => setShowLogin(true)} className="m-2 mt-6 rounded-xl bg-fuchsia-500 px-5 py-3 font-black text-white">教師端</button><button onClick={() => setRole("student")} className="m-2 mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-900">學生端</button></>}</div></main>;
  return role === "teacher" ? <Teacher teacherPassword="teacher123" /> : <Student />;
}

createRoot(document.getElementById("root")).render(<><HomeLink /><App /></>);
