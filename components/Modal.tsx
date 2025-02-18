import { YouTubeEmbed } from "@next/third-parties/google";
import { MouseEventHandler } from "react";

const Modal = ({
  onClick,
}: {
  onClick: MouseEventHandler<HTMLButtonElement>;
}) => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadein 0.5s",
        }}
      >
        <div>
          <div style={{ width: "600px", maxWidth: "100vw" }}>
            <YouTubeEmbed videoid="k2i73lmL3CM" />
          </div>
          <button style={{ marginTop: "1rem" }} onClick={onClick}>
            閉じる
          </button>
        </div>
      </div>
    </>
  );
};

export default Modal;
