import type { ClassroomLayout, DeskMode } from '../types';

export function createLayout(rows: number, desksPerRow: number, deskMode: DeskMode = 'paired', groupSize = 4, lastDeskSingle = false): ClassroomLayout {
  const seatsPerDesk = deskMode === 'individual' ? 1 : deskMode === 'paired' ? 2 : groupSize;
  if (!Number.isInteger(rows) || rows < 1 || rows > 10 || !Number.isInteger(desksPerRow) || desksPerRow < 1 || desksPerRow > 8 || !Number.isInteger(seatsPerDesk) || seatsPerDesk < 1 || seatsPerDesk > 10) {
    throw new Error('座位配置須使用有效整數');
  }
  const width = seatsPerDesk === 1 ? 1 : 2;
  const height = Math.ceil(seatsPerDesk / width);
  return {
    rows, desksPerRow, deskMode, seatsPerDesk, lastDeskSingle: deskMode === 'paired' && lastDeskSingle,
    seats: Array.from({ length: rows * desksPerRow * seatsPerDesk }, (_, i) => {
      const row = Math.floor(i / (desksPerRow * seatsPerDesk)) + 1;
      const desk = Math.floor((i % (desksPerRow * seatsPerDesk)) / seatsPerDesk);
      const side = i % seatsPerDesk;
      return {
        id: `r${row}d${desk + 1}s${side + 1}`, row,
        column: desk * (seatsPerDesk + 1) + side + 1,
        deskId: `r${row}d${desk + 1}`, enabled: true,
        // Physical coordinates match the visible two-column group grid.
        // One horizontal walkway separates desks; empty slots are not seats.
        gridRow: (row - 1) * height + Math.floor(side / width) + 1,
        gridColumn: desk * (width + 1) + side % width + 1,
      };
    }).filter(seat => !(deskMode === 'paired' && lastDeskSingle && seat.deskId === `r${seat.row}d${desksPerRow}` && seat.id.endsWith('s2'))),
  };
}

export function seatLabel(row: number, column: number, seatsPerDesk = 2) {
  return `第${row}排第${Math.floor((column - 1) / (seatsPerDesk + 1)) * seatsPerDesk + (column - 1) % (seatsPerDesk + 1) + 1}位`;
}
