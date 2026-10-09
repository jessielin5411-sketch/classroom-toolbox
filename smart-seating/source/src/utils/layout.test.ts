import { describe, expect, it } from 'vitest';
import { createLayout, seatLabel } from './layout';
import { adjacent, checkConstraints } from '../services/constraintChecker';
import { generateSeating } from '../services/seatingEngine';
import { emptyData, storageService } from '../services/storageService';

describe('三種桌型',()=>{
 it('個人桌每個座位有獨立deskId，走道不相鄰',()=>{
  const l=createLayout(5,6,'individual');expect(l.seats).toHaveLength(30);
  expect(new Set(l.seats.map(s=>s.deskId)).size).toBe(30);
  expect(adjacent(l.seats[0],l.seats[1])).toBe(false);
  expect(adjacent(l.seats[0],l.seats[6])).toBe(true);
  expect(seatLabel(l.seats[1].row,l.seats[1].column,1)).toBe('第1排第2位');
 });
 it.each([3,4,5,6,10])('小組%d人，同桌分組與实际相鄰符合畫面',n=>{
  const l=createLayout(2,2,'group',n);expect(l.seats).toHaveLength(4*n);
  expect(l.seats.filter(s=>s.deskId==='r1d1')).toHaveLength(n);
  expect(adjacent(l.seats[0],l.seats[1])).toBe(true);
  expect(adjacent(l.seats[0],l.seats[2])).toBe(true);
  expect(adjacent(l.seats[1],l.seats[2])).toBe(false);
  expect(adjacent(l.seats[1],l.seats[n])).toBe(false);
  expect(seatLabel(l.seats[n].row,l.seats[n].column,n)).toBe(`第1排第${n+1}位`);
  expect(new Set(l.seats.map(s=>s.id)).size).toBe(4*n);
 });
 it.each(['individual','group'] as const)('%s桌型能產生遵守同桌分開、前座與固定的結果',mode=>{
  const d=emptyData();d.layout=createLayout(3,3,mode,4);
  d.students=Array.from({length:8},(_,i)=>({id:String(i),number:String(i+1),name:`學生${i+1}`,gender:'unset'}));
  d.settings.separateGroups=[{id:'g',studentIds:['0','1','2'],rule:'sameDesk'}];
  d.settings.fixedSeats=[{studentId:'7',seatId:d.layout.seats[0].id}];
  d.settings.frontSeatRules=[{studentIds:['0','1'],maxRow:2}];
  expect(checkConstraints(d,generateSeating(d))).toBe(true);
 });
 it('舊資料補上兩人桌預設，保留名單與結果',()=>{
  const d=emptyData();const legacy=JSON.parse(JSON.stringify(d));delete legacy.layout.deskMode;delete legacy.layout.seatsPerDesk;
  Object.defineProperty(globalThis,'localStorage',{value:{getItem:()=>JSON.stringify(legacy)},configurable:true});
  const loaded=storageService.load();expect(loaded.layout.deskMode).toBe('paired');expect(loaded.layout.seatsPerDesk).toBe(2);expect(loaded.students).toEqual(d.students);expect(loaded.layout.seats).toEqual(d.layout.seats);
 });
});

describe('雙人桌搭配最後單人桌',()=>{
 it('每排4桌可排7位，單人桌不產生多餘座位',()=>{
  const l=createLayout(4,4,'paired',4,true);
  expect(l.seats).toHaveLength(28);
  expect(l.seats.filter(s=>s.row===1)).toHaveLength(7);
  expect(l.seats.filter(s=>s.deskId==='r1d4')).toHaveLength(1);
  expect(l.seats.some(s=>s.id==='r1d4s2')).toBe(false);
  expect(seatLabel(l.seats[6].row,l.seats[6].column,l.seatsPerDesk)).toBe('第1排第7位');
  expect(adjacent(l.seats[5],l.seats[6])).toBe(false);
  expect(adjacent(l.seats[6],l.seats[13])).toBe(true);
 });
 it('27人可排28位，固定與同桌分開限制仍有效',()=>{
  const d=emptyData();d.layout=createLayout(4,4,'paired',4,true);
  d.students=Array.from({length:27},(_,i)=>({id:String(i),number:String(i+1),name:`學生${i+1}`,gender:i%2?'female':'male'}));
  d.settings.genderMode='mixedDesk';d.settings.fixedSeats=[{studentId:'0',seatId:'r1d4s1'}];
  d.settings.separateGroups=[{id:'g',studentIds:['3','8','12','17'],rule:'sameDesk'}];
  const a=generateSeating(d);expect(a).toHaveLength(27);expect(checkConstraints(d,a)).toBe(true);
  expect(a).toContainEqual({studentId:'0',seatId:'r1d4s1'});
 });
});
