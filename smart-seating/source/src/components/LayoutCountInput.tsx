import { useEffect, useState } from 'react';

/** Keep incomplete edits in the field; only valid whole numbers change the layout. */
export function LayoutCountInput({ label, value, min = 1, max, onChange }: {
  label: string;
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraft(String(value));
    setError(false);
  }, [value]);

  function valid(text: string) {
    const number = Number(text);
    return text.trim() !== '' && Number.isInteger(number) && number >= min && number <= max;
  }

  function finish() {
    if (!valid(draft)) {
      setDraft(String(value));
      setError(true);
    }
  }

  return <div className="layout-count-field">
    <label>{label}<input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step="1"
      value={draft}
      aria-invalid={error}
      onChange={event => {
        const text = event.target.value;
        setDraft(text);
        setError(false);
        if (valid(text)) onChange(Number(text));
      }}
      onBlur={finish}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    /></label>
    {error && <span className="error" role="alert">請輸入 {min}～{max} 的整數，已保留原設定。</span>}
  </div>;
}
