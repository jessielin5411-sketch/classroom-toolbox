import type { Assignment,ClassroomLayout,Student } from '../types';
import { seatLabel } from '../utils/layout';
export function SeatingChart({layout,students,assignments=[],editing=false,onToggle}:{layout:ClassroomLayout;students:Student[];assignments?:Assignment[];editing?:boolean;onToggle?:(id:string)=>void}) {
  return <div className={`classroom ${editing?'editing':''} layout-${layout.deskMode}`}>
    <div className="blackboard">黑 板<span>教室前方</span></div>
    <div className="seat-grid" style={{gridTemplateColumns:Array.from({length:layout.desksPerRow},(_,desk)=>layout.deskMode==='paired'&&layout.lastDeskSingle&&desk===layout.desksPerRow-1?'minmax(80px, 0.5fr)':`minmax(${layout.deskMode==='individual'?80:140}px, 1fr)`).join(' ')}}>
      {Array.from({length:layout.rows*layout.desksPerRow},(_,i)=>{
        const row=Math.floor(i/layout.desksPerRow)+1,desk=i%layout.desksPerRow+1;
        return <div className="desk" key={`${row}-${desk}`} style={{gridTemplateColumns:`repeat(${layout.deskMode==='individual'||(layout.deskMode==='paired'&&layout.lastDeskSingle&&desk===layout.desksPerRow)?1:2}, minmax(0, 1fr))`}}>
          {layout.seats.filter(s=>s.deskId===`r${row}d${desk}`).map(s=>{
            const a=assignments.find(a=>a.seatId===s.id),student=students.find(x=>x.id===a?.studentId);
            const label=seatLabel(s.row,s.column,layout.seatsPerDesk);
            const content=<><strong>{student?student.number:editing?label.replace(/第|位/g,''):'—'}</strong><span>{student?student.name:s.enabled?editing?'使用中':'空位':'不使用'}</span></>;
            return editing?<button key={s.id} className={`seat ${s.enabled?'':'disabled'}`} aria-label={`${label}，${s.enabled?'使用中':'不使用'}`} aria-pressed={s.enabled} onClick={()=>onToggle?.(s.id)}>{content}</button>:<div key={s.id} className={`seat ${s.enabled?'':'disabled'}`}>{content}</div>;
          })}
        </div>;
      })}
    </div>
  </div>;
}
