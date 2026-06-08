export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <polygon points="8,28 18,18 15,18 15,11 21,11 21,18 18,18" fill="#22C55E" />
        <circle cx="24" cy="8" r="2.5" fill="#6366F1" />
        <circle cx="29" cy="11" r="2.5" fill="#6366F1" />
        <circle cx="31" cy="17" r="2.5" fill="#6366F1" />
        <circle cx="29" cy="23" r="2.5" fill="#6366F1" opacity="0.5" />
        <circle cx="24" cy="26" r="2.5" fill="#6366F1" opacity="0.3" />
      </svg>
      <span className="text-[22px] font-extrabold tracking-tight text-white">clickvibe</span>
    </div>
  );
}
