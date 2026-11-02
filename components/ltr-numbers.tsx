// A number with its sign ("5%", "98.61%", "+180") keeps its written order inside Arabic, so «أفضل 5%» never
// reads «%5». The number never takes a sentence's last full stop or comma with it.
export function LtrNumbers({ text }: { text: string }) {
  return text.split(/([+]?\d(?:[\d.,]*\d)?[%+]?)/).map((part, index) =>
    index % 2 ? <bdi key={index} dir="ltr">{part}</bdi> : part
  );
}
