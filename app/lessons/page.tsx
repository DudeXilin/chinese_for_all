import Link from "next/link";

export const metadata = {
  title: "Chinese For All",
};

export default function LessonsPage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
      }}
    >
      <Link
        href="/"
        aria-label="Назад"
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 2147483647,
          width: "57px",
          height: "57px",
          borderRadius: "50%",
          backgroundColor: "#3a3a3a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          fontFamily: "Arial, sans-serif",
          fontSize: "32px",
          fontWeight: 400,
          lineHeight: 1,
          boxSizing: "border-box",
          paddingBottom: "4px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
        }}
      >
        &lt;
      </Link>
    </main>
  );
}
