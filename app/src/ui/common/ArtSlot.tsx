import { ART_SLOT_ASSETS } from './artSlots.js';

interface Props {
  slotId: string;
  width: number;   // px
  height: number;  // px
  alt?: string;
}

export default function ArtSlot({ slotId, width, height, alt }: Props) {
  const asset = ART_SLOT_ASSETS[slotId] ?? null;
  const label = alt ?? slotId;

  if (asset !== null) {
    return <img src={asset} alt={label} width={width} height={height} />;
  }

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width,
        height,
        border: '1px solid var(--color-border, #c8c0b0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <svg width="20" height="24" viewBox="0 0 20 24" aria-hidden="true" focusable="false">
        {/* head */}
        <circle cx="10" cy="4" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* body */}
        <line x1="10" y1="7" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" />
        {/* arms */}
        <line x1="4" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="1.5" />
        {/* legs */}
        <line x1="10" y1="17" x2="5" y2="23" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10" y1="17" x2="15" y2="23" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span style={{ fontSize: '9px', textAlign: 'center', lineHeight: 1.2, marginTop: '2px', wordBreak: 'break-word' }}>
        {label}
      </span>
    </div>
  );
}
