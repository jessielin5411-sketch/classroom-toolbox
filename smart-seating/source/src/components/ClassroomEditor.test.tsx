// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ClassroomEditor } from './ClassroomEditor';
import { createLayout } from '../utils/layout';

function Editor() {
  const [layout, setLayout] = useState(createLayout(5, 3));
  return <ClassroomEditor layout={layout} count={0} onChange={setLayout}/>;
}
afterEach(cleanup);

describe('教室座位數字輸入', () => {
  it('可清空排數後重新輸入10，座位數會更新', () => {
    render(<Editor/>);
    const rows = screen.getByRole('spinbutton', { name: '排數' }) as HTMLInputElement;
    fireEvent.change(rows, { target: { value: '' } });
    expect(rows.value).toBe('');
    expect(screen.getByText('30 個有效座位')).toBeTruthy();
    fireEvent.change(rows, { target: { value: '1' } });
    fireEvent.change(rows, { target: { value: '10' } });
    expect(rows.value).toBe('10');
    expect(screen.getByText('60 個有效座位')).toBeTruthy();
    fireEvent.blur(rows);
    expect(rows.value).toBe('10');
  });
  it('每排桌數也可清空重打，並保留不使用座位', () => {
    render(<Editor/>);
    fireEvent.click(screen.getByRole('button', { name: '第1排第1位，使用中' }));
    const desks = screen.getByRole('spinbutton', { name: '每排桌數' }) as HTMLInputElement;
    fireEvent.change(desks, { target: { value: '' } });
    expect(desks.value).toBe('');
    fireEvent.change(desks, { target: { value: '4' } });
    expect(screen.getByText('39 個有效座位')).toBeTruthy();
    expect(screen.getByRole('button', { name: '第1排第1位，不使用' })).toBeTruthy();
  });
  it.each(['', '0', '11', '2.5', '-1'])('排數輸入「%s」離開時恢復原設定', value => {
    render(<Editor/>);
    const rows = screen.getByRole('spinbutton', { name: '排數' }) as HTMLInputElement;
    fireEvent.change(rows, { target: { value } });
    expect(screen.getByText('30 個有效座位')).toBeTruthy();
    fireEvent.blur(rows);
    expect(rows.value).toBe('5');
    expect(screen.getByRole('alert').textContent).toContain('1～10');
  });
  it('Enter完成輸入，桌數超出範圍不修改配置', () => {
    render(<Editor/>);
    const desks = screen.getByRole('spinbutton', { name: '每排桌數' }) as HTMLInputElement;
    desks.focus();
    fireEvent.change(desks, { target: { value: '9' } });
    fireEvent.keyDown(desks, { key: 'Enter' });
    expect(desks.value).toBe('3');
    expect(screen.getByText('30 個有效座位')).toBeTruthy();
  });
});

describe('桌型設定互動',()=>{
  it('可切換個人桌，再切換小組並清空重輸人數',()=>{
    render(<Editor/>);
    fireEvent.click(screen.getByRole('radio',{name:'獨立個人桌'}));
    expect(screen.getByText('15 個有效座位')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio',{name:'小組共桌'}));
    expect(screen.getByText('60 個有效座位')).toBeTruthy();
    const size=screen.getByRole('spinbutton',{name:'每桌人數'}) as HTMLInputElement;
    fireEvent.change(size,{target:{value:''}});expect(size.value).toBe('');
    fireEvent.change(size,{target:{value:'6'}});expect(screen.getByText('90 個有效座位')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio',{name:'兩人一桌'}));
    expect(screen.getByText('30 個有效座位')).toBeTruthy();
    expect(screen.queryByRole('spinbutton',{name:'每桌人數'})).toBeNull();
  });
  it('小組人数小於3時恢復原設定',()=>{
    render(<Editor/>);fireEvent.click(screen.getByRole('radio',{name:'小組共桌'}));
    const size=screen.getByRole('spinbutton',{name:'每桌人數'}) as HTMLInputElement;
    fireEvent.change(size,{target:{value:'2'}});fireEvent.blur(size);
    expect(size.value).toBe('4');expect(screen.getByRole('alert').textContent).toContain('3～10');
  });
});

describe('每排單數座位',()=>{
 it('4桌勾選最後單人桌可排7位，修改排數後仍保留',()=>{
  render(<Editor/>);
  fireEvent.change(screen.getByRole('spinbutton',{name:'每排桌數'}),{target:{value:'4'}});
  fireEvent.click(screen.getByRole('checkbox',{name:'每排最後一桌為單人桌'}));
  expect(screen.getByText('35 個有效座位')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'第1排第8位，使用中'})).toBeNull();
  expect(screen.getByRole('button',{name:'第1排第7位，使用中'}).parentElement?.style.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
  fireEvent.change(screen.getByRole('spinbutton',{name:'排數'}),{target:{value:'4'}});
  expect(screen.getByText('28 個有效座位')).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox',{name:'每排最後一桌為單人桌'}));
  expect(screen.getByText('32 個有效座位')).toBeTruthy();
 });
});
