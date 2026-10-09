import type { ClassroomLayout, DeskMode } from '../types';
import { createLayout } from '../utils/layout';
import { SeatingChart } from './SeatingChart';
import { LayoutCountInput } from './LayoutCountInput';
const deskModes: [DeskMode, string, string][] = [
  ['paired', '兩人一桌', '每桌 2 個座位'],
  ['individual', '獨立個人桌', '每桌 1 個座位'],
  ['group', '小組共桌', '自行設定每桌人數'],
];
export function ClassroomEditor({layout,count,onChange}:{layout:ClassroomLayout;count:number;onChange:(l:ClassroomLayout)=>void}) {
  const resize = (rows:number, desks:number, mode=layout.deskMode, groupSize=layout.seatsPerDesk, lastSingle=layout.lastDeskSingle??false) => {
    const next = createLayout(rows, desks, mode, mode==='group' && groupSize<3 ? 4 : groupSize, lastSingle);
    onChange({...next,seats:next.seats.map(s=>({...s,enabled:layout.seats.find(x=>x.id===s.id)?.enabled??true}))});
  };
  const enabled = layout.seats.filter(s=>s.enabled).length;
  return <section className="panel">
    <div className="panel-title"><div><h2>教室座位</h2><p>選擇適合這次上課的桌型，桌與桌之間保留走道。</p></div><span className="badge">{enabled} 個有效座位</span></div>
    <fieldset className="desk-modes"><legend>座位桌型</legend>{deskModes.map(([mode,title,detail])=><label className={layout.deskMode===mode?'active':''} key={mode}><input type="radio" name="desk-mode" aria-label={title} checked={layout.deskMode===mode} onChange={()=>resize(layout.rows,layout.desksPerRow,mode)}/><div><strong>{title}</strong><span>{detail}</span></div></label>)}</fieldset>
    <div className="toolbar">
      <LayoutCountInput label="排數" value={layout.rows} max={10} onChange={rows=>resize(rows,layout.desksPerRow)}/>
      <LayoutCountInput label="每排桌數" value={layout.desksPerRow} max={8} onChange={desks=>resize(layout.rows,desks)}/>
      {layout.deskMode==='group'&&<LayoutCountInput label="每桌人數" value={layout.seatsPerDesk} min={3} max={10} onChange={size=>resize(layout.rows,layout.desksPerRow,'group',size)}/>}
    </div>
    {layout.deskMode==='paired'&&<div className="odd-row-setting"><label><input type="checkbox" checked={layout.lastDeskSingle??false} onChange={e=>resize(layout.rows,layout.desksPerRow,layout.deskMode,layout.seatsPerDesk,e.target.checked)}/>每排最後一桌為單人桌</label><p>每排 {layout.desksPerRow*2-(layout.lastDeskSingle?1:0)} 個座位{layout.lastDeskSingle?`：${layout.desksPerRow-1} 張雙人桌＋1 張單人桌`:'，可勾選改成單數座位'}。</p></div>}
    <p className="hint">「排數」是由黑板往後的橫排數；橫向需要 7 個座位時，設為每排 4 桌，並勾選最後一桌為單人桌。</p>
    <p className="hint">點選座位切換「使用中／不使用」。多出的有效座位會隨機留空。切換桌型或人數後，請確認固定座位是否仍適用。</p>
    {layout.deskMode==='group'&&<p className="hint">每個外框為一張共桌；「不能同桌」會套用到整桌所有成員。座位由上至下、每列左至右編號。</p>}
    {enabled<count&&<p className="error">有效座位不足，請至少提供 {count} 個座位。</p>}
    <SeatingChart layout={layout} students={[]} editing onToggle={id=>onChange({...layout,seats:layout.seats.map(s=>s.id===id?{...s,enabled:!s.enabled}:s)})}/>
  </section>;
}
