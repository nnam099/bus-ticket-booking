export default function WaveDivider({ fillClassName }) {
  return (
    <div className="w-full overflow-hidden leading-none -translate-y-[1px]">
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className={`block w-full h-12 ${fillClassName}`}>
        <path d="M0,24 C360,48 1080,0 1440,24 L1440,0 L0,0 Z" />
      </svg>
    </div>
  );
}
