export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-s8">
      <h1 className="text-4xl font-extrabold tracking-tight text-text-1">
        LZR App
      </h1>
      <p className="mt-s4 text-lg text-text-2">
        Template Next.js App Router — LZR Technologies
      </p>
      <a
        href="https://code.lzrtechnologies.com"
        className="mt-s5 text-accent underline transition-colors duration-fast hover:text-accent-hi"
        target="_blank"
        rel="noopener noreferrer"
      >
        Engineering Handbook
      </a>
    </main>
  )
}
