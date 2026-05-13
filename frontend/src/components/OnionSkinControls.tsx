import type { OnionSkinSettings } from "../types";

type OnionSkinControlsProps = {
  settings: OnionSkinSettings;
  onChange: (settings: OnionSkinSettings) => void;
};

export function OnionSkinControls({ settings, onChange }: OnionSkinControlsProps) {
  const percent = Math.round(settings.opacity * 100);

  return (
    <div className="onion-controls">
      <label className="onion-toggle">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
        />
        <span className="onion-toggle__label">Onion skin</span>
      </label>
      <div className="onion-slider-wrap">
        <input
          className="onion-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.opacity}
          onChange={(event) => onChange({ ...settings, opacity: Number(event.target.value) })}
          disabled={!settings.enabled}
          aria-label="Onion skin opacity"
        />
        <span className="onion-value">{percent}%</span>
      </div>
    </div>
  );
}
