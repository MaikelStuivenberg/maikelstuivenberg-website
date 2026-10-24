type Props = {
  questions: string[];
  questionIndex: number;
  cta: string;
  onStart: () => void;
};

const PIN_SPOTS = [
  { left: "38%", top: "42%", delay: "0s" },
  { left: "52%", top: "38%", delay: "0.8s" },
  { left: "46%", top: "55%", delay: "1.6s" },
  { left: "58%", top: "48%", delay: "2.2s" },
  { left: "42%", top: "62%", delay: "1.1s" },
  { left: "50%", top: "28%", delay: "2.8s" },
];

function TouchFingerIcon() {
  return (
    <svg
      className="h-10 w-10 shrink-0"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path
        d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"
      />
    </svg>
  );
}

export function AttractScreen({
  questions,
  questionIndex,
  cta,
  onStart,
}: Props) {
  const question = questions[questionIndex];

  return (
    <button
      type="button"
      className="kiosk-attract relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl text-center shadow-inner"
      onClick={onStart}
    >
      <div className="kiosk-attract-gradient" aria-hidden="true" />
      <div className="kiosk-attract-lines" aria-hidden="true" />

      <div className="kiosk-attract-map-wrap" aria-hidden="true">
        <svg
          className="kiosk-attract-map"
          viewBox="0 0 200 240"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="kiosk-attract-map-fill"
            d="M48 32 L148 28 L172 52 L188 88 L178 128 L158 168 L128 198 L88 212 L52 196 L28 158 L22 108 L32 58 L48 32 Z"
          />
          <path
            className="kiosk-attract-map-stroke"
            d="M48 32 L148 28 L172 52 L188 88 L178 128 L158 168 L128 198 L88 212 L52 196 L28 158 L22 108 L32 58 L48 32 Z"
          />
        </svg>
        {PIN_SPOTS.map((pin, i) => (
          <span
            key={i}
            className="kiosk-attract-pin"
            style={{
              left: pin.left,
              top: pin.top,
              animationDelay: pin.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-6 py-8">
        <p key={questionIndex} className="kiosk-attract-question">
          {question}
        </p>
        <div className="kiosk-attract-cta">
          <TouchFingerIcon />
          <span className="text-2xl font-bold tracking-tight md:text-3xl">
            {cta}
          </span>
        </div>
      </div>
    </button>
  );
}
