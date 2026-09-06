export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <iframe
        src="/index.html"
        title="liquidGL"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
      />
    </main>
  );
}
