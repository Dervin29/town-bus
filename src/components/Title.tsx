export default function Title() {
  return (
    <div className="text-center">
      <h1
        className="
          font-title
          text-4xl
          font-black
          leading-[1.05]
          tracking-wide
          text-white/90
          [text-shadow:4px_4px_0_#3b2a20,7px_7px_0_#1f1712]
          sm:text-7xl
          md:text-8xl
        "
      >
        டவுன் பஸ்
        <span className="block">ஜன்னல் ஓரம்</span>
      </h1>

      <p
        className="
          font-subtitle
          mt-4
          text-base
          font-medium
          text-amber-100/80
          [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]
          sm:text-xl
        "
      >
        ஒரு பழைய பயணம்...
      </p>
    </div>
  );
}
