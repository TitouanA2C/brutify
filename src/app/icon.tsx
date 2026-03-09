import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await fetch(
    new URL("https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-C8.woff2")
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090B",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "Anton",
            fontSize: 22,
            color: "#FFAB00",
            letterSpacing: "0.02em",
          }}
        >
          B
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Anton",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
}
