import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "กินไรดี — Smart Kitchen",
    short_name: "กินไรดี",
    description: "ผู้ช่วยคิดเมนูจากวัตถุดิบที่มี",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2e8",
    theme_color: "#48664c",
    lang: "th",
  };
}
