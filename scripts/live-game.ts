/**
 * Local classroom game server for 「誰要看它」.
 *
 * Students join on their own phones over classroom WiFi. The projector shows
 * only the answer ratio, so nobody can copy an answer off the wall; the teacher
 * drives the rounds and may put one anonymous sentence on screen.
 *
 * Everything lives in memory and disappears when the process stops: no
 * database, no third-party service, no student data leaving the room.
 *
 *   bun run live
 */

import { type LiveRound, liveRounds } from '../src/data/live-rounds'

type Role = 'student' | 'projector' | 'teacher'

interface Handshake {
  role: Role
  code: string
  name: string
}

interface Submission {
  roundId: string
  optionId: string
  reason: string
  predict: string
  clientId: number
}

interface Participant {
  nickname: string
}

interface Room {
  code: string
  roundIndex: number
  locked: boolean
  showEvidence: boolean
  clients: Map<number, Participant>
  submissions: Map<number, Submission>
  votes: Map<string, Set<number>>
  spotlight: { roundId: string; reason: string } | null
}

/** The one operation this server needs from a socket, on either side. */
interface Channel {
  send(data: string): unknown
  close(code?: number, reason?: string): void
}

interface Peer {
  role: Role | null
  code: string
  clientId: number
}

const rooms = new Map<string, Room>()
const peers = new Map<Channel, Peer>()

let nextClientId = 1

function pickCode() {
  let code = ''
  do {
    code = String(Math.floor(Math.random() * 9000) + 1000)
  } while (rooms.has(code))
  return code
}

function createRoom() {
  const code = pickCode()
  const room: Room = {
    code,
    roundIndex: 0,
    locked: true,
    showEvidence: false,
    clients: new Map(),
    submissions: new Map(),
    votes: new Map(),
    spotlight: null,
  }
  rooms.set(code, room)
  return room
}

function currentRound(room: Room): LiveRound | undefined {
  return liveRounds[room.roundIndex]
}

function tally(room: Room, round: LiveRound) {
  const counts = new Map<string, number>(round.options.map((option) => [option.id, 0]))
  for (const submission of room.submissions.values()) {
    if (submission.roundId !== round.id) continue
    const current = counts.get(submission.optionId)
    if (current === undefined) continue
    counts.set(submission.optionId, current + 1)
  }
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0)
  return {
    total,
    bars: round.options.map((option) => ({
      id: option.id,
      label: option.label,
      detail: option.detail,
      count: counts.get(option.id) ?? 0,
      share: total === 0 ? 0 : Math.round(((counts.get(option.id) ?? 0) / total) * 100),
    })),
  }
}

function topReasons(room: Room, roundId: string, limit: number) {
  const bucket = new Map<string, number>()
  for (const submission of room.submissions.values()) {
    if (submission.roundId !== roundId) continue
    const reason = submission.reason.trim().slice(0, 80)
    if (!reason) continue
    bucket.set(reason, (bucket.get(reason) ?? 0) + 1)
  }
  return [...bucket.entries()]
    .map(([reason, own]) => ({ reason, votes: own + (room.votes.get(reason)?.size ?? 0) }))
    .sort((left, right) => right.votes - left.votes)
    .slice(0, limit)
}

/** The public shape every role shares: who is here and where the room is. */
export interface RoomState {
  code: string
  joined: number
  roundIndex: number
  roundCount: number
  locked: boolean
  round: RoomRound | null
  results: Tally | null
  reasons: ReasonTally[]
  spotlight: { roundId: string; reason: string } | null
}

/** What a student or the teacher sees. The projector never receives this. */
export interface RoomRound {
  id: string
  stage: LiveRound['stage']
  axis: string | undefined
  prompt: string
  context: string
  options: LiveRound['options']
}

export interface Tally {
  total: number
  bars: { id: string; label: string; detail: string; count: number; share: number }[]
}

export interface ReasonTally {
  reason: string
  votes: number
}

export interface TeacherState extends RoomState {
  reveal: string | undefined
  teaches: string | undefined
  showEvidence: boolean
  allRounds: {
    index: number
    id: string
    axis: string | undefined
    stage: LiveRound['stage']
    prompt: string
  }[]
}

export interface StudentState extends RoomState {
  myAnswer: string | null
  myReasons: string[]
  myVotes: string[]
  /** The teacher decides when the supporting data point is revealed. */
  showEvidence: boolean
  evidence: LiveRound['evidence']
}

export interface ProjectorState {
  joined: number
  roundIndex: number
  roundCount: number
  locked: boolean
  axis: string | undefined
  results: Tally | null
  spotlight: { roundId: string; reason: string } | null
}

export interface ServerMessageMap {
  'teacher:code': { code: string }
  'teacher:state': TeacherState
  'teacher:export': ExportPayload
  'student:joined': { clientId: number; nickname: string; joined: number }
  'student:state': StudentState
  'projector:state': ProjectorState
  'error:message': { text: string }
}

export type ServerMessage = {
  [K in keyof ServerMessageMap]: { type: K; payload: ServerMessageMap[K] }
}[keyof ServerMessageMap]

export interface ExportPayload {
  code: string
  rounds: {
    id: string
    stage: LiveRound['stage']
    axis: string | undefined
    prompt: string
    results: Tally
  }[]
  submissions: Submission[]
}

function roomState(room: Room): RoomState {
  const round = currentRound(room)
  return {
    code: room.code,
    joined: room.clients.size,
    roundIndex: room.roundIndex,
    roundCount: liveRounds.length,
    locked: room.locked,
    round: round
      ? {
          id: round.id,
          stage: round.stage,
          axis: round.axis,
          prompt: round.prompt,
          context: round.context,
          options: round.options,
        }
      : null,
    results: round ? tally(room, round) : null,
    reasons: round ? topReasons(room, round.id, 3) : [],
    spotlight: room.spotlight,
  }
}

function send<T extends keyof ServerMessageMap>(
  ws: Channel,
  type: T,
  payload: ServerMessageMap[T]
) {
  try {
    const message: ServerMessage = { type, payload } as ServerMessage
    ws.send(JSON.stringify(message))
  } catch {
    // The socket closed between the state change and this send.
  }
}

function pushState(code: string) {
  const room = rooms.get(code)
  if (!room) return
  const state = roomState(room)

  for (const [ws, peer] of peers) {
    if (peer.code !== code || peer.role === null) continue

    if (peer.role === 'teacher') {
      send(ws, 'teacher:state', {
        ...state,
        reveal: currentRound(room)?.reveal,
        teaches: currentRound(room)?.teaches,
        showEvidence: room.showEvidence,
        allRounds: liveRounds.map((round, index) => ({
          index,
          id: round.id,
          axis: round.axis,
          stage: round.stage,
          prompt: round.prompt,
        })),
      })
      continue
    }

    if (peer.role === 'projector') {
      // Deliberately narrow: the projector must never receive prompt copy, so a
      // student watching the wall still cannot read the question.
      send(ws, 'projector:state', {
        joined: state.joined,
        roundIndex: state.roundIndex,
        roundCount: state.roundCount,
        locked: state.locked,
        axis: state.round?.axis,
        results: state.results,
        spotlight: state.spotlight,
      })
      continue
    }

    const mine = [...room.submissions.values()].filter(
      (submission) => submission.clientId === peer.clientId
    )
    send(ws, 'student:state', {
      ...state,
      myAnswer: mine.find((submission) => submission.roundId === state.round?.id)?.optionId ?? null,
      myReasons: mine
        .filter((submission) => submission.reason)
        .map((submission) => submission.reason),
      reasons: state.reasons,
      myVotes: [...room.votes.entries()]
        .filter(([, set]) => set.has(peer.clientId))
        .map(([reason]) => reason),
      results: state.locked ? state.results : null,
      spotlight: state.spotlight,
      showEvidence: room.showEvidence,
      evidence: currentRound(room)?.evidence,
    })
  }
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 8787),
  fetch(request, serverInstance) {
    const url = new URL(request.url)

    if (url.pathname === '/ws') {
      const upgraded = serverInstance.upgrade(request)
      return upgraded ? undefined : new Response('expected websocket', { status: 400 })
    }

    if (url.pathname === '/rounds') {
      return Response.json(
        liveRounds.map((round) => ({
          id: round.id,
          stage: round.stage,
          axis: round.axis,
          prompt: round.prompt,
        }))
      )
    }

    const page =
      url.pathname === '/p' ? projectorPage : url.pathname === '/t' ? teacherPage : studentPage
    return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  },
  websocket: {
    open(ws) {
      // The role is not known yet. Every client sends `hello` as its first
      // message, which is what assigns the role and the room.
      peers.set(ws, { role: null, code: '', clientId: -1 })
    },
    message(ws, raw) {
      const peer = peers.get(ws)
      if (!peer) return
      let message: { type?: string; payload?: Record<string, string> }
      try {
        message = JSON.parse(String(raw))
      } catch {
        return
      }
      const payload = message.payload ?? {}

      if (peer.role === null) {
        const role = (payload.role ?? 'student') as Role
        identify(ws, { role, code: payload.code ?? '', name: payload.name ?? '' })
        return
      }

      if (peer.role === 'student') {
        const room = rooms.get(peer.code)
        if (!room) return
        const round = currentRound(room)
        if (message.type === 'answer') {
          if (!round || room.locked) return
          if (!round.options.some((option) => option.id === payload.optionId)) return
          room.submissions.set(peer.clientId, {
            roundId: round.id,
            optionId: payload.optionId,
            reason: (payload.reason ?? '').slice(0, 80),
            predict: (payload.predict ?? '').slice(0, 1).toUpperCase(),
            clientId: peer.clientId,
          })
        }
        if (message.type === 'vote') {
          const reason = (payload.reason ?? '').slice(0, 80)
          if (!reason) return
          const set = room.votes.get(reason) ?? new Set<number>()
          if (set.has(peer.clientId)) set.delete(peer.clientId)
          else set.add(peer.clientId)
          room.votes.set(reason, set)
        }
      }

      if (peer.role === 'teacher') {
        const room = rooms.get(peer.code)
        if (!room) return
        if (message.type === 'teacher:reveal') {
          // Lock the current round so its tally appears. It stays on screen
          // until the teacher advances, because the discussion needs the
          // numbers of the round the students just answered.
          room.locked = true
          room.spotlight = null
        }
        if (message.type === 'teacher:next') {
          room.roundIndex = Math.min(room.roundIndex + 1, liveRounds.length - 1)
          room.locked = true
          room.spotlight = null
        }
        if (message.type === 'teacher:unlock') {
          room.locked = false
          room.spotlight = null
        }
        if (message.type === 'teacher:show-evidence') room.showEvidence = payload.on === 'true'
        if (message.type === 'teacher:goto') {
          const index = Number(payload.index)
          if (Number.isInteger(index) && index >= 0 && index < liveRounds.length) {
            room.roundIndex = index
            room.locked = false
            room.spotlight = null
          }
        }
        if (message.type === 'teacher:spotlight') {
          const round = currentRound(room)
          const reason = (payload.reason ?? '').slice(0, 80)
          if (round && reason) room.spotlight = { roundId: round.id, reason }
        }
        if (message.type === 'teacher:clear-spotlight') room.spotlight = null
        if (message.type === 'teacher:export') {
          send(ws, 'teacher:export', {
            code: room.code,
            rounds: liveRounds.map((round) => ({
              id: round.id,
              stage: round.stage,
              axis: round.axis,
              prompt: round.prompt,
              results: tally(room, round),
            })),
            submissions: [...room.submissions.values()],
          })
        }
      }

      pushState(peer.code)
    },
    close(ws) {
      const peer = peers.get(ws)
      if (!peer) return
      const room = rooms.get(peer.code)
      if (room && peer.clientId >= 0) {
        room.clients.delete(peer.clientId)
        room.submissions.delete(peer.clientId)
        for (const set of room.votes.values()) set.delete(peer.clientId)
      }
      peers.delete(ws)
      if (room) pushState(room.code)
    },
  },
})

function identify(ws: Channel, handshake: Handshake) {
  const peer = peers.get(ws)
  if (!peer) return

  if (handshake.role === 'teacher') {
    const room = createRoom()
    peers.set(ws, { role: 'teacher', code: room.code, clientId: -1 })
    send(ws, 'teacher:code', { code: room.code })
    pushState(room.code)
    return
  }

  if (handshake.role === 'projector') {
    // The projector follows whichever room has exactly one teacher; the teacher
    // always connects first in the setup order.
    const room = [...rooms.values()].pop()
    if (!room) {
      send(ws, 'error:message', { text: '老師端還沒開，請先開老師端。' })
      ws.close()
      return
    }
    peers.set(ws, { role: 'projector', code: room.code, clientId: -1 })
    pushState(room.code)
    return
  }

  const room = rooms.get(handshake.code)
  if (!room) {
    send(ws, 'error:message', { text: '房號不存在，請重新確認投影上的數字。' })
    ws.close()
    return
  }
  const clientId = nextClientId++
  const nickname = handshake.name.slice(0, 20) || `同學 ${clientId}`
  room.clients.set(clientId, { nickname })
  peers.set(ws, { role: 'student', code: room.code, clientId })
  send(ws, 'student:joined', { clientId, nickname, joined: room.clients.size })
  pushState(room.code)
}

console.log(
  `課堂遊戲已啟動\n  學生端  http://localhost:${server.port}\n  投影端  http://localhost:${server.port}/p\n  老師端  http://localhost:${server.port}/t`
)
console.log('先開老師端拿房號，投影端再開，最後同學用手機連學生端。')

const studentPage = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>誰要看它</title>
<style>
:root{--ink:#071f34;--paper:#fdf6e8;--blue:#0d5e82;--coral:#ff6b5e;--sun:#ffd447;--sky:#cfe8f5}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;line-height:1.6;padding:20px 16px 48px}
h1{font-size:1.5rem;margin:0 0 4px}
.sub{color:var(--blue);font-size:.85rem;margin:0 0 20px}
label{display:block;font-size:.8rem;color:var(--blue);margin:12px 0 4px}
input{width:100%;padding:12px;border:2px solid var(--ink);border-radius:10px;font-size:1.1rem;background:#fff}
button{width:100%;margin-top:16px;padding:14px;border:2px solid var(--ink);border-radius:10px;background:var(--sun);font-size:1.05rem;font-weight:700;cursor:pointer}
button:disabled{opacity:.45}
.stage{display:none}
.stage.on{display:block}
.bar{margin:8px 0}
.track{position:relative;height:38px;border:2px solid var(--ink);border-radius:8px;background:#fff;overflow:hidden}
.fill{position:absolute;inset:0;width:0;background:var(--sky);transition:width .4s}
.label{position:relative;display:flex;align-items:center;justify-content:space-between;height:100%;padding:0 12px;font-weight:700;font-size:.9rem}
.opt{display:block;width:100%;text-align:left;margin:0 0 10px;padding:14px 16px;border:2px solid var(--ink);border-radius:12px;background:#fff;font-size:1rem;font-weight:600}
.opt small{display:block;font-weight:400;opacity:.7;margin-top:2px}
.opt.sel{background:var(--sun)}
.box{margin-top:20px;padding:16px;border:2px solid var(--ink);border-radius:12px;background:#fff}
.box h3{margin:0 0 8px;font-size:.9rem;color:var(--blue)}
.tag{display:inline-block;margin:4px 6px 0 0;padding:7px 11px;border:1.5px solid var(--blue);border-radius:999px;background:#fff;font-size:.85rem;font-weight:600;cursor:pointer}
.tag.on{background:var(--coral);color:#fff;border-color:var(--coral)}
.hint{font-size:.8rem;opacity:.65;margin-top:10px}
</style></head><body>
<h1>誰要看它</h1>
<p class="sub">先押，投影才會動</p>

<div id="join" class="stage on">
  <label for="code">投影上的房號</label>
  <input id="code" inputmode="numeric" maxlength="4" placeholder="四碼數字">
  <label for="name">你的代號（只給老師看，投影上不出現）</label>
  <input id="name" maxlength="20" placeholder="例如：小彎">
  <button id="go">加入</button>
  <p class="hint">房號在投影畫面上。加入之後，題目和選項只在你手機上。</p>
</div>

<div id="play" class="stage">
  <p class="sub" id="progress">—</p>
  <h2 id="prompt">—</h2>
  <p id="context" style="opacity:.8;font-size:.95rem"></p>
  <div id="options" style="margin-top:16px"></div>
  <label for="reason">為什麼？（最多 80 字）</label>
  <input id="reason" maxlength="80" placeholder="因為…">
  <button id="send">送出</button>
  <p class="hint" id="lockhint"></p>
  <div id="after" style="display:none">
    <div class="box"><h3>班級比例</h3><div id="bars"></div></div>
    <div class="box"><h3>全班在想什麼（點一句投 +1）</h3><div id="reasons"></div></div>
  </div>
  <div class="box" id="evbox" style="display:none;background:#fff3b0"><h3>真實世界的數字</h3><p id="ev" style="margin:0"></p></div>
  <div class="box"><h3>我的紀錄</h3><div id="mytags"></div></div>
</div>

<div id="err" class="stage"><p style="font-weight:700" id="errtext"></p><button onclick="location.reload()">重新加入</button></div>

<script>
const $=s=>document.querySelector(s);
let ws=null, state=null;

$('#go').onclick=()=>{
  const code=$('#code').value.trim(), name=$('#name').value.trim();
  if(code.length!==4){alert('請輸入投影上的四碼房號');return;}
  $('#join').classList.remove('on'); $('#err').classList.remove('on'); $('#play').classList.add('on');
  const proto=location.protocol==='https:'?'wss':'ws';
  ws=new WebSocket(proto+'://'+location.host+'/ws');
  ws.onopen=()=>ws.send(JSON.stringify({type:'hello',payload:{role:'student',code,name}}));
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.type==='error:message'){ $('#play').classList.remove('on'); $('#err').classList.add('on'); $('#errtext').textContent=m.payload.text; return; }
    if(m.type==='student:state'){ state=m.payload; render(); }
  };
  ws.onclose=()=>{ if(!state){ $('#play').classList.remove('on'); $('#err').classList.add('on'); $('#errtext').textContent='連線中斷，請重新加入。'; } };
};

$('#send').onclick=()=>{
  const picked=document.querySelector('.opt.sel');
  if(!picked){alert('先選一個');return;}
  ws.send(JSON.stringify({type:'answer',payload:{optionId:picked.dataset.id,reason:$('#reason').value}}));
};

function render(){
  if(!state) return;
  const r=state.round;
  $('#progress').textContent='第 '+(state.roundIndex+1)+' / '+state.roundCount+' 題　已加入 '+state.joined+' 人';
  if(!r){ $('#prompt').textContent='等老師開第一題…'; return; }
  $('#prompt').textContent=r.prompt;
  $('#context').textContent=r.context;
  const box=$('#options'); box.innerHTML='';
  r.options.forEach(o=>{
    const b=document.createElement('button');
    b.className='opt'+(state.myAnswer===o.id?' sel':'');
    b.dataset.id=o.id; b.disabled=state.locked||!!state.myAnswer;
    b.innerHTML=o.label+'<small>'+o.detail+'</small>';
    b.onclick=()=>{document.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');};
    box.appendChild(b);
  });
  const ev=$('#ev');
  if(state.showEvidence&&state.evidence){ $('#evbox').style.display='block'; ev.innerHTML='<b>'+state.evidence.label+'</b>'+state.evidence.value+'<a href="'+state.evidence.url+'" target="_blank" rel="noreferrer">'+state.evidence.source+' ↗</a>'; }
  else { $('#evbox').style.display='none'; }
  $('#send').disabled=state.locked||!!state.myAnswer;
  $('#lockhint').textContent=state.myAnswer?'已送出，等老師開下一題。':state.locked?'老師還沒開這一題。':'選一個之後送出。';
  $('#after').style.display=state.locked?'block':'none';
  const bars=$('#bars'); bars.innerHTML='';
  if(state.results) state.results.bars.forEach(b=>{
    const d=document.createElement('div'); d.className='bar';
    d.innerHTML='<div class="track"><div class="fill" style="width:'+b.share+'%"></div></div><div class="label" style="height:auto;padding:4px 0"><span>'+b.label+'</span><span>'+b.share+'%</span></div>';
    bars.appendChild(d);
  });
  const rs=$('#reasons'); rs.innerHTML='';
  if(state.reasons) state.reasons.forEach(x=>{
    const t=document.createElement('button');
    t.className='tag'+(state.myVotes.includes(x.reason)?' on':'');
    t.textContent=x.reason+'　+'+x.votes;
    t.onclick=()=>ws.send(JSON.stringify({type:'vote',payload:{reason:x.reason}}));
    rs.appendChild(t);
  });
  $('#mytags').innerHTML='<span class="tag" style="cursor:default">寫過 '+state.myReasons.length+' 句理由</span><span class="tag" style="cursor:default">投了 '+state.myVotes.length+' 個 +1</span>';
}
</script></body></html>`

const projectorPage = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>投影 · 誰要看它</title>
<style>
:root{--ink:#071f34;--paper:#fdf6e8;--sun:#ffd447;--sky:#cfe8f5}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--paper);font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;padding:48px 56px;line-height:1.5}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid var(--paper);padding-bottom:16px}
.axis{font-size:1.4rem;font-weight:800;color:var(--sun)}
.count{font-size:1.1rem;opacity:.8}
.bar{margin-bottom:34px}
.lab{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
.lab .name{font-size:2.4rem;font-weight:800}
.pct{color:var(--sun);font-size:3.2rem;font-weight:800;line-height:1}
.track{height:44px;background:rgba(255,255,255,.12);border:2px solid var(--paper);border-radius:8px;overflow:hidden}
.fill{height:100%;background:var(--sky);transition:width .5s}
.spot{margin-top:56px;padding:36px;border:3px solid var(--sun);border-radius:16px;background:rgba(0,0,0,.25)}
.spot .k{font-size:1rem;color:var(--sun);letter-spacing:.2em}
.spot p{margin:14px 0 0;font-size:2.2rem;font-weight:700;line-height:1.4}
.wait{margin-top:72px;font-size:2.6rem;font-weight:800;text-align:center;opacity:.85}
</style></head><body>
<div class="top"><div class="axis" id="axis">誰要看它</div><div class="count" id="count">—</div></div>
<div id="wait" class="wait">等第一題…</div>
<div id="bars" style="display:none"></div>
<div id="spotwrap"></div>
<script>
const $=s=>document.querySelector(s);
const ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws');
ws.onopen=()=>ws.send(JSON.stringify({type:'hello',payload:{role:'projector'}}));
ws.onmessage=e=>{
  const m=JSON.parse(e.data);
  if(m.type==='error:message'){ $('#wait').textContent=m.payload.text; return; }
  if(m.type!=='projector:state') return;
  const s=m.payload;
  $('#count').textContent='第 '+(s.roundIndex+1)+' / '+s.roundCount+' 題　已加入 '+s.joined+' 人';
  $('#axis').textContent=s.axis||'誰要看它';
  const has=s.results&&s.results.total>0;
  $('#wait').style.display=has?'none':'block';
  $('#wait').textContent=s.joined===0?'還沒有人加入':(s.locked?'等下一題':'已經可以押了');
  $('#bars').style.display=has?'block':'none';
  if(has) $('#bars').innerHTML=s.results.bars.map(b=>'<div class="bar"><div class="lab"><span class="name">'+b.label+'</span><span class="pct">'+b.share+'%</span></div><div class="track"><div class="fill" style="width:'+b.share+'%"></div></div></div>').join('');
  $('#spotwrap').innerHTML=s.spotlight?'<div class="spot"><div class="k">全班在想什麼</div><p>'+s.spotlight.reason+'</p></div>':'';
};
</script></body></html>`

const teacherPage = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>老師 · 誰要看它</title>
<style>
:root{--ink:#071f34;--paper:#fdf6e8;--blue:#0d5e82;--coral:#ff6b5e;--sun:#ffd447;--sky:#cfe8f5}
*{box-sizing:border-box}
body{margin:0 auto;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;line-height:1.6;padding:28px 24px 60px;max-width:1100px}
h1{font-size:1.4rem;margin:0 0 6px}
.code{display:inline-block;margin:12px 0 22px;padding:14px 28px;background:var(--sun);border:3px solid var(--ink);border-radius:12px;font-size:2.6rem;font-weight:800;letter-spacing:.12em}
.bar{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
button{padding:12px 20px;border:2px solid var(--ink);border-radius:10px;background:#fff;font-weight:700;font-size:1rem;cursor:pointer}
button.pri{background:var(--coral);color:#fff}
.q{border:2px solid var(--ink);border-radius:14px;background:#fff;padding:20px;margin:14px 0}
.q .k{font-size:.8rem;color:var(--blue);letter-spacing:.16em}
.q h2{margin:8px 0 4px;font-size:1.3rem}
.reveal{margin-top:12px;padding:14px;background:var(--sky);border-radius:10px;font-size:.95rem}
.money{margin-top:10px;padding:14px;background:#fff3b0;border:2px solid var(--ink);border-radius:10px;font-size:.95rem}
.money b{display:block;color:var(--coral);font-size:.8rem;letter-spacing:.14em;margin-bottom:6px}
.tag{padding:3px 9px;border:1.5px solid var(--ink);border-radius:999px;font-size:.75rem;font-weight:700;white-space:nowrap}
.b{display:flex;align-items:center;gap:10px;margin:6px 0;font-size:.9rem}
.b .t{flex:1;height:26px;background:#eee;border-radius:6px;overflow:hidden;max-width:320px}
.b .f{display:block;height:100%;background:var(--blue)}
.b .n{width:56px;text-align:right;font-weight:700}
ul.rr{list-style:none;padding:0;margin:10px 0 0}
ul.rr li{margin:6px 0}
ul.rr button{width:100%;text-align:left;font-weight:500;font-size:.95rem}
ul.rr button.on{background:var(--sun)}
.out{width:100%;height:240px;margin-top:12px;font-family:ui-monospace,monospace;font-size:.8rem;padding:12px;border:2px solid var(--ink);border-radius:10px}
</style></head><body>
<h1>誰要看它 · 老師端</h1>
<p style="color:var(--blue);margin:0">房號（讓學生輸入）：</p>
<div class="code" id="code">—</div>
<div class="bar">
  <button class="pri" id="unlock">開這一題（讓學生押）</button>
  <button id="reveal">公布比例（留在這題讓大家看）</button>
  <button id="next">進入下一題</button>
  <button id="ev">給學生看真實數據</button>
  <button id="clear">收掉投影上的句子</button>
  <button id="export">匯出學生作答</button>
</div>
<div id="state"></div>
<h3 style="margin-top:32px">全部回合</h3>
<div id="all"></div>
<h3 style="margin-top:32px">匯出結果</h3>
<textarea class="out" id="out" readonly placeholder="按「匯出學生作答」後，這裡會出現每個學生每回合的選項與理由，可以存成檔案當成服務對象判斷的證據。"></textarea>
<script>
const $=s=>document.querySelector(s);
const ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws');
ws.onopen=()=>ws.send(JSON.stringify({type:'hello',payload:{role:'teacher'}}));
ws.onmessage=e=>{
  const m=JSON.parse(e.data);
  if(m.type==='teacher:code'){ $('#code').textContent=m.payload.code; }
  if(m.type==='teacher:state') render(m.payload);
  if(m.type==='teacher:export') $('#out').value=JSON.stringify(m.payload,null,2);
};
const send=(type,payload={})=>ws.send(JSON.stringify({type,payload}));
$('#unlock').onclick=()=>send('teacher:unlock');
$('#reveal').onclick=()=>send('teacher:reveal');
$('#next').onclick=()=>send('teacher:next');
$('#ev').onclick=()=>send('teacher:show-evidence',{on:String(!state.showEvidence)});
$('#clear').onclick=()=>send('teacher:clear-spotlight');
$('#export').onclick=()=>send('teacher:export');
let state=null;
function render(s){
  if(!s||!s.round){ $('#state').innerHTML='<p>還沒有回合。</p>'; return; }
  state=s;
  $('#ev').textContent=state.showEvidence?'收起真實數據':'給學生看真實數據';
  const r=s.round;
  let h='<div class="q"><div class="k">'+(r.axis||r.stage)+' · 第 '+(s.roundIndex+1)+' / '+s.roundCount+' 題</div><h2>'+r.prompt+'</h2><p style="opacity:.75">'+r.context+'</p><div class="reveal">'+(s.reveal||'')+'</div>'+(s.teaches?'<div class="money"><b>這回合在練什麼</b>'+s.teaches+'</div>':'')+'</div>';
  h+='<h3>比例（'+s.joined+' 人已加入）</h3>';
  (s.results?s.results.bars:[]).forEach(b=>{h+='<div class="b"><span style="width:130px;font-weight:600">'+b.label+'</span><span class="t"><span class="f" style="width:'+b.share+'%"></span></span><span class="n">'+b.share+'%</span></div>';});
  h+='</div><h3>理由（點一下投到投影）</h3>';
  if(!s.reasons.length) h+='<p style="opacity:.6">還沒有人寫理由。</p>';
  h+='<ul class="rr">';
  s.reasons.forEach(x=>{h+='<li><button data-r="'+x.reason.replace(/"/g,'&quot;')+'">'+x.reason+'　+'+x.votes+'</button></li>';});
  h+='</ul>';
  $('#state').innerHTML=h;
  document.querySelectorAll('#state .rr button').forEach(b=>b.onclick=()=>send('teacher:spotlight',{reason:b.dataset.r}));
  let all='<ul class="rr">';
  (s.allRounds||[]).forEach(x=>{all+='<li><button data-i="'+x.index+'"'+(x.index===s.roundIndex?' class="on"':'')+'>'+(x.index+1)+'. '+(x.axis?x.axis+'：':'')+x.prompt+'</button></li>';});
  all+='</ul>';
  $('#all').innerHTML=all;
  document.querySelectorAll('#all button').forEach(b=>b.onclick=()=>send('teacher:goto',{index:Number(b.dataset.i)}));
}
</script></body></html>`

export type { Room, Submission }
