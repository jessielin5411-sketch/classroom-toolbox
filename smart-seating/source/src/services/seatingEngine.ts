import type { Assignment, ClassData } from '../types';
import { adjacent,checkConstraints } from './constraintChecker';
export const MAX_ATTEMPTS=3000;
export function shuffle<T>(items:T[],rng:()=>number=Math.random):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function genderScore(data:ClassData,as:Assignment[]):number {
 if(data.settings.genderMode==='none')return 0;
 const entries=as.map(a=>({s:data.layout.seats.find(s=>s.id===a.seatId)!,g:data.students.find(s=>s.id===a.studentId)!.gender}));let score=0;
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){const a=entries[i],b=entries[j];if(a.g==='unset'||b.g==='unset')continue;const relevant=data.settings.genderMode==='alternate'?adjacent(a.s,b.s):a.s.deskId===b.s.deskId;if(relevant)score+=(data.settings.genderMode==='sameGenderDesk'?a.g===b.g:a.g!==b.g)?1:0;}
 return score;
}
export function generateSeating(data:ClassData,rng:()=>number=Math.random):Assignment[] {
 const seats=data.layout.seats.filter(s=>s.enabled);const ids=new Set(data.students.map(s=>s.id));
 if(!ids.size||ids.size!==data.students.length||seats.length<data.students.length)throw new Error('條件無法完成');
 const fixed:Assignment[]=data.settings.fixedSeats.map(f=>({...f}));
 if(!checkConstraints(data,fixed,true)||fixed.some(f=>!ids.has(f.studentId)))throw new Error('條件無法完成');
 for(const f of data.settings.fixedSeats)if(!seats.some(s=>s.id===f.seatId))throw new Error('條件無法完成');
 const remaining=data.students.filter(s=>!fixed.some(f=>f.studentId===s.id));
 const candidates:{a:Assignment[];score:number}[]=[];let budget=MAX_ATTEMPTS;
 // Randomized bounded backtracking gives tightly constrained pupils a viable place,
 // unlike whole-class rejection sampling. Every explored placement consumes budget.
 while(budget>0&&candidates.length<72){const a=[...fixed];const free=seats.filter(s=>!fixed.some(f=>f.seatId===s.id));
 const order=shuffle(remaining,rng).sort((x,y)=>{const rank=(id:string)=>data.settings.frontSeatRules.filter(r=>r.studentIds.includes(id)).length*10+data.settings.separateGroups.filter(g=>g.studentIds.includes(id)).reduce((n,g)=>n+g.studentIds.length,0);return rank(y.id)-rank(x.id);});
 const visit=(index:number):boolean=>{if(index===order.length)return true;if(budget<=0)return false;for(const seat of shuffle(free.filter(s=>!a.some(p=>p.seatId===s.id)),rng)){if(budget--<=0)return false;a.push({studentId:order[index].id,seatId:seat.id});if(checkConstraints(data,a,true)&&visit(index+1))return true;a.pop();}return false;};
 if(visit(0)&&checkConstraints(data,a))candidates.push({a:[...a],score:genderScore(data,a)});
 }
 if(!candidates.length)throw new Error('條件無法完成');
 // Improve soft preferences only with swaps that continue to satisfy every hard rule.
 for(const c of candidates){for(let n=0;n<180;n++){const movable=c.a.filter(a=>!fixed.some(f=>f.studentId===a.studentId));if(movable.length<2)break;const x=movable[Math.floor(rng()*movable.length)],y=movable[Math.floor(rng()*movable.length)];const next=c.a.map(a=>a.studentId===x.studentId?{...a,seatId:y.seatId}:a.studentId===y.studentId?{...a,seatId:x.seatId}:a);if(checkConstraints(data,next)){const score=genderScore(data,next);if(score>=c.score){c.a=next;c.score=score;}}}}
 candidates.sort((a,b)=>b.score-a.score);const best=candidates.filter(c=>c.score===candidates[0].score);return shuffle(best,rng)[0].a;
}
