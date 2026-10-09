import type { Assignment, ClassData, Seat } from '../types';
export const adjacent=(a:Seat,b:Seat)=>Math.abs((a.gridRow??a.row)-(b.gridRow??b.row))+Math.abs((a.gridColumn??a.column)-(b.gridColumn??b.column))===1;
export function checkConstraints(data:ClassData,assignments:Assignment[],partial=false):boolean {
 const seats=new Map(data.layout.seats.filter(s=>s.enabled).map(s=>[s.id,s]));
 const placed=new Map<string,Seat>();const occupied=new Set<string>();
 for(const a of assignments){const s=seats.get(a.seatId);if(!s||occupied.has(s.id)||placed.has(a.studentId)||!data.students.some(x=>x.id===a.studentId))return false;placed.set(a.studentId,s);occupied.add(s.id);}
 if(!partial&&placed.size!==data.students.length)return false;
 for(const f of data.settings.fixedSeats){const s=placed.get(f.studentId);if(s&&s.id!==f.seatId)return false;if(!partial&&!s)return false;}
 for(const r of data.settings.frontSeatRules)for(const id of r.studentIds){const s=placed.get(id);if(s&&s.row>r.maxRow)return false;}
 for(const g of data.settings.separateGroups)for(let i=0;i<g.studentIds.length;i++)for(let j=i+1;j<g.studentIds.length;j++){const a=placed.get(g.studentIds[i]),b=placed.get(g.studentIds[j]);if(a&&b&&(g.rule==='sameDesk'?a.deskId===b.deskId:adjacent(a,b)))return false;}
 return true;
}
