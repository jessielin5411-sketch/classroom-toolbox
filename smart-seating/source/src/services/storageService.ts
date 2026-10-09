import type { ClassData } from '../types';
import { createLayout } from '../utils/layout';
const KEY='smart-seating-v1';
export const emptyData=():ClassData=>({className:'',students:[],layout:createLayout(5,3),settings:{genderMode:'none',separateGroups:[],frontSeatRules:[],fixedSeats:[]},lastResult:[],resultDate:''});
export const storageService={load():ClassData {try{const raw=localStorage.getItem(KEY);if(!raw)return emptyData();const d=JSON.parse(raw);if(!d||typeof d.className!=='string'||!Array.isArray(d.students)||!d.layout||!Array.isArray(d.layout.seats)||!d.settings||!Array.isArray(d.settings.fixedSeats)||!Array.isArray(d.settings.separateGroups)||!Array.isArray(d.settings.frontSeatRules)||!Array.isArray(d.lastResult))return emptyData();return {...d,layout:{...d.layout,deskMode:d.layout.deskMode??'paired',seatsPerDesk:d.layout.seatsPerDesk??2}};}catch{return emptyData();}},save(data:ClassData){localStorage.setItem(KEY,JSON.stringify(data));}};
