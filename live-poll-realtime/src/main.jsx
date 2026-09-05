import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useState } from "react";
import classroomDecor from "./assets/quick-quiz-3d-corners.png";
const API = "https://classroom-live-poll.curse-beet.workers.dev",
  colors = ["bg-rose-400", "bg-sky-400", "bg-amber-300", "bg-emerald-400"];
const classroomBackground = {
  backgroundColor: "#fff1de",
  backgroundImage: `url(${classroomDecor})`,
  backgroundPosition: "center top",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% auto",
};
const newPin = () =>
  Array.from(
    { length: 6 },
    () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");
const blank = () => ({
  type: "choice",
  prompt: "請輸入評量題目",
  options: ["選項 A", "選項 B", "選項 C", "選項 D"],
  correctAnswer: "a",
});
function useRoom(pin, role, seat) {
  const [state, setState] = useState(null),
    [send, setSend] = useState(() => () => {});
  useEffect(() => {
    if (!pin) return;
    const ws = new WebSocket(API.replace(/^http/, "ws") + "/classroom/" + pin);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({ event: "join", data: { role, seat, group: "A" } }),
      );
      setSend(
        () => (event, data) =>
          ws.readyState === 1 && ws.send(JSON.stringify({ event, data })),
      );
    };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.event === "state") setState(m.data);
    };
    return () => ws.close();
  }, [pin, role, seat]);
  return [state, send];
}
function Home() {
  return (
    <a
      href="../"
      className="fixed left-4 top-4 z-50 rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 shadow"
    >
      ← 返回教學工具箱
    </a>
  );
}
function Teacher() {
  const [pin, setPin] = useState(""),
    [bank, setBank] = useState([blank()]),
    [active, setActive] = useState(0),
    [seconds, setSeconds] = useState(0);
  const [state, send] = useRoom(pin, "teacher", "teacher");
  const question = state?.quiz,
    answers = question?.answers || {},
    counts = useMemo(
      () =>
        Object.values(answers).reduce(
          (x, id) => ({ ...x, [id]: (x[id] || 0) + 1 }),
          {},
        ),
      [answers],
    );
  const edit = (key, value) =>
    setBank((items) =>
      items.map((q, i) => (i === active ? { ...q, [key]: value } : q)),
    );
  const publish = () => {
    const q = bank[active],
      options =
        q.type === "truefalse"
          ? [
              { id: "true", label: "是" },
              { id: "false", label: "否" },
            ]
          : q.options.map((label, i) => ({ id: "abcd"[i], label }));
    send("quiz:publish", { ...q, options });
    if (seconds) setTimeout(() => send("quiz:close", {}), seconds * 1000);
  };
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-sky-100 via-amber-50 to-rose-100 p-5 text-slate-700"
      style={classroomBackground}
    >
      <Home />
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-black text-indigo-700">⚡ 快速評量區</h1>
        {!pin ? (
          <button
            onClick={() => setPin(newPin())}
            className="mt-6 rounded-2xl bg-indigo-600 px-6 py-4 text-xl font-black text-white shadow"
          >
            建立評量教室
          </button>
        ) : (
          <>
            <p className="mt-4 rounded-2xl bg-white p-4 shadow">
              學生 PIN：<b className="text-indigo-600">{pin}</b>　學生連結：
              {location.origin + location.pathname + "?pin=" + pin}
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-[230px_1fr_1fr]">
              <aside className="rounded-3xl bg-white p-4 shadow">
                <h2 className="font-black">題庫（{bank.length}/10）</h2>
                {bank.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={
                      "mt-2 w-full rounded-xl p-3 text-left font-bold " +
                      (active === i
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100")
                    }
                  >
                    第 {i + 1} 題<br />
                    <small>{q.prompt.slice(0, 18)}</small>
                  </button>
                ))}
                {bank.length < 10 && (
                  <button
                    onClick={() => {
                      setBank([...bank, blank()]);
                      setActive(bank.length);
                    }}
                    className="mt-3 w-full rounded-xl bg-amber-300 p-3 font-black"
                  >
                    ＋ 新增題目
                  </button>
                )}
              </aside>
              <section className="rounded-3xl bg-white p-5 shadow">
                <h2 className="font-black">編輯第 {active + 1} 題</h2>
                <select
                  value={bank[active].type}
                  onChange={(e) => edit("type", e.target.value)}
                  className="mt-3 w-full rounded-xl border p-3"
                >
                  <option value="choice">單選題（4 選項）</option>
                  <option value="truefalse">是非題</option>
                </select>
                <textarea
                  value={bank[active].prompt}
                  onChange={(e) => edit("prompt", e.target.value)}
                  className="mt-3 w-full rounded-xl border p-3"
                />
                {bank[active].type === "choice" &&
                  bank[active].options.map((v, i) => (
                    <input
                      key={i}
                      value={v}
                      onChange={(e) =>
                        edit(
                          "options",
                          bank[active].options.map((x, j) =>
                            i === j ? e.target.value : x,
                          ),
                        )
                      }
                      className="mt-2 w-full rounded-xl border p-3"
                    />
                  ))}
                <select
                  value={bank[active].correctAnswer}
                  onChange={(e) => edit("correctAnswer", e.target.value)}
                  className="mt-3 w-full rounded-xl border p-3"
                >
                  {(bank[active].type === "truefalse"
                    ? [
                        { id: "true", label: "是" },
                        { id: "false", label: "否" },
                      ]
                    : bank[active].options.map((label, i) => ({
                        id: "abcd"[i],
                        label,
                      }))
                  ).map((x) => (
                    <option key={x.id} value={x.id}>
                      正確答案：{x.label}
                    </option>
                  ))}
                </select>
                <label className="mt-3 block text-sm font-black text-slate-600">
                  倒數秒數
                  <select
                  value={seconds}
                  onChange={(e) => setSeconds(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-3"
                >
                  <option value="0">手動關閉</option>
                  <option value="10">10 秒</option>
                  <option value="30">30 秒</option>
                  <option value="60">60 秒</option>
                  <option value="90">90 秒</option>
                  <option value="120">120 秒</option>
                </select>
                </label>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={publish}
                    className="rounded-xl bg-indigo-600 px-5 py-3 font-black text-white"
                  >
                    📣 發布本題
                  </button>
                  <button
                    onClick={() => send("quiz:close", {})}
                    className="rounded-xl bg-slate-700 px-5 py-3 font-black text-white"
                  >
                    關閉作答
                  </button>
                </div>
              </section>
              <Stats q={question} counts={counts} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
function Stats({ q, counts }) {
  if (!q)
    return (
      <section className="rounded-3xl bg-white p-5 shadow">
        發布題目後顯示即時長條圖。
      </section>
    );
  const total = Object.keys(q.answers || {}).length;
  return (
    <section className="rounded-3xl bg-white p-5 shadow">
      <h2 className="font-black">即時統計・{total} 人作答</h2>
      {q.options.map((o, i) => {
        const n = counts[o.id] || 0,
          p = total ? Math.round((n / total) * 100) : 0;
        return (
          <div className="mt-4" key={o.id}>
            <div className="flex justify-between">
              <span>
                {o.label}
                {!q.open && q.correctAnswer === o.id ? " ✅" : ""}
              </span>
              <b>
                {n} 人・{p}%
              </b>
            </div>
            <div className="mt-2 h-7 overflow-hidden rounded-full bg-slate-100">
              <div
                className={colors[i] + " h-full transition-all duration-500"}
                style={{ width: p + "%" }}
              />
            </div>
          </div>
        );
      })}
      {q.open && (
        <p className="mt-5 text-amber-600">作答進行中，正確答案暫時隱藏。</p>
      )}
    </section>
  );
}
function Student() {
  const preset = new URLSearchParams(location.search).get("pin") || "";
  const [pin, setPin] = useState(preset),
    [seat, setSeat] = useState(sessionStorage.getItem("qa-seat") || ""),
    [joined, setJoined] = useState(false);
  const [state, send] = useRoom(joined ? pin : "", "student", seat),
    q = state?.quiz,
    done = Boolean(q?.answers?.[seat]);
  if (!joined)
    return (
      <main
        className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-300 via-amber-100 to-rose-200 p-5"
        style={classroomBackground}
      >
        <Home />
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow">
          <h1 className="text-3xl font-black text-indigo-700">加入快速評量</h1>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            placeholder="6 碼 PIN"
            className="mt-5 w-full rounded-xl border p-4"
          />
          <input
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
            placeholder="座號／姓名"
            className="mt-3 w-full rounded-xl border p-4"
          />
          <button
            onClick={() => {
              if (!pin || !seat) return alert("請輸入 PIN 與座號／姓名");
              sessionStorage.setItem("qa-seat", seat);
              setJoined(true);
            }}
            className="mt-4 w-full rounded-xl bg-indigo-600 p-4 font-black text-white"
          >
            加入教室
          </button>
        </div>
      </main>
    );
  if (!q)
    return (
      <main
        className="grid min-h-screen place-items-center bg-sky-50 text-2xl font-black text-indigo-700"
        style={classroomBackground}
      >
        <Home />
        等待老師發布評量題目…
      </main>
    );
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-sky-100 via-amber-50 to-rose-100 p-5 text-slate-700"
      style={classroomBackground}
    >
      <Home />
      <div className="mx-auto max-w-2xl">
        <p className="font-black text-indigo-600">快速評量</p>
        <h1 className="mt-3 text-4xl font-black">{q.prompt}</h1>
        {done ? (
          <div className="mt-10 rounded-3xl bg-emerald-400 p-8 text-center text-2xl font-black">
            ✅ 已送出，請看前方螢幕
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {q.options.map((o, i) => (
              <button
                disabled={!q.open}
                onClick={() => send("quiz:answer", { optionId: o.id })}
                key={o.id}
                className={
                  colors[i] +
                  " min-h-28 rounded-3xl p-6 text-left text-2xl font-black shadow disabled:opacity-40"
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
function App() {
  const [role, setRole] = useState(
    new URLSearchParams(location.search).get("pin") ? "student" : "",
  );
  if (!role)
    return (
      <main
        className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-100 via-amber-50 to-rose-100 text-slate-700"
        style={classroomBackground}
      >
        <Home />
        <div className="text-center">
          <h1 className="text-4xl font-black text-indigo-700">⚡ 快速評量區</h1>
          <button
            onClick={() => setRole("teacher")}
            className="m-2 mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-black text-white"
          >
            教師端
          </button>
          <button
            onClick={() => setRole("student")}
            className="m-2 mt-6 rounded-xl bg-cyan-300 px-5 py-3 font-black"
          >
            學生端
          </button>
        </div>
      </main>
    );
  return role === "teacher" ? <Teacher /> : <Student />;
}
createRoot(document.getElementById("root")).render(<App />);
