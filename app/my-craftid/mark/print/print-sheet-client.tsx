"use client";

/* eslint-disable @next/next/no-img-element */

type Props = {
  craftId: string;
  stickerUrl: string;
  printLabel: string;
  sheetLabel: string;
};

export default function PrintSheetClient({
  craftId,
  stickerUrl,
  printLabel,
  sheetLabel,
}: Props) {
  return (
    <>
      <div className="printSheetControls">
        <button
          className="button buttonPrimary"
          type="button"
          onClick={() => window.print()}
        >
          {printLabel}
        </button>
        <span>{sheetLabel}</span>
      </div>

      <section
        className="craftIdPrintSheet"
        aria-label={`CraftID #${craftId} sticker print sheet`}
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <div className="printStickerCell" key={index}>
            <img
              src={stickerUrl}
              alt={`CraftID #${craftId} round sticker ${index + 1}`}
            />
          </div>
        ))}
      </section>
    </>
  );
}
