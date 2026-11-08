import Image from "next/image";

interface BlurredBackgroundProps {
  src: string;
}

export default function BlurredBackground({ src }: BlurredBackgroundProps) {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-110 object-cover blur-xl"
      />
      <div className="absolute inset-0 bg-[var(--color-bg)]/60" />
    </div>
  );
}
