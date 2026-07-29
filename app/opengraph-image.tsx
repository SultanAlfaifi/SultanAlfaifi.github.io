import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt =
  "Sultan Alfaifi — Full-Stack Software Engineer specializing in AI Agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111816",
          color: "#f7f6f0",
          padding: "72px",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#c8ff3d", fontSize: 22 }}>SULTAN ALFAIFI</span>
          <span style={{ color: "#aeb9b3", fontSize: 18 }}>SYS.PORTFOLIO / 2026</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, lineHeight: 1.05, maxWidth: 970 }}>
            Full-Stack Software Engineer specializing in AI Agents
          </div>
          <div style={{ color: "#c5cec9", fontSize: 28 }}>
            Interface → Backend → APIs → Data → AI Agents
          </div>
        </div>
      </div>
    ),
    size
  );
}
