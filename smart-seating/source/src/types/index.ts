export type Gender = 'male' | 'female' | 'unset';
export interface Student { id:string; number:string; name:string; gender:Gender }
export interface Seat { id:string; row:number; column:number; deskId:string; enabled:boolean; gridRow?:number; gridColumn?:number }
export type DeskMode = 'paired'|'individual'|'group';
export interface ClassroomLayout { rows:number; desksPerRow:number; deskMode:DeskMode; seatsPerDesk:number; lastDeskSingle?:boolean; seats:Seat[] }
export interface SeparateGroup { id:string; studentIds:string[]; rule:'sameDesk'|'adjacent' }
export interface FrontSeatRule { studentIds:string[]; maxRow:number }
export interface FixedSeat { studentId:string; seatId:string }
export type GenderMode = 'none'|'alternate'|'mixedDesk'|'sameGenderDesk';
export interface Settings { genderMode:GenderMode; separateGroups:SeparateGroup[]; frontSeatRules:FrontSeatRule[]; fixedSeats:FixedSeat[] }
export interface Assignment { studentId:string; seatId:string }
export interface ClassData { className:string; students:Student[]; layout:ClassroomLayout; settings:Settings; lastResult:Assignment[]; resultDate:string }
