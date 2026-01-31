import React from "react";
import { C } from "../theme";

interface AvatarProps {
  name: string;
  size?: number;
}

const AVATAR_COLORS = ["#E07A3A", "#4A90D9", "#3BA55D", "#D94A4A", "#8B6CC1", "#E8B931"];

export function Avatar({ name, size = 40 }: AvatarProps) {
  const colorIndex = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
  
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: AVATAR_COLORS[colorIndex],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#FFF",
        fontFamily: C.body,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
