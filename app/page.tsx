import Image from "next/image";
import Header from "./components/Header";

export default function Home() {
  return (
    <div className="home-page">
      <Header />
      <main className="home-content">

        <div className="intro-content">
          <p className="intro-eyebrow">COSMETOLOGIST · PRAGUE</p>
          <h1 className="intro-title">
            Healthy skin starts <br />
            with the right care.
          </h1>
          <p className="intro-copy">
            Personalized skincare treatments grounded in medical knowledge. Each session is built around your skin — its condition, its history, and its needs.

            {/* <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="text-link"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="text-link"
            >
              Learning
            </a>{" "}
            center. */}
          </p>
        </div>
        {/* <div className="action-links">
          <a
            className="primary-link"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="vercel-logo"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="secondary-link"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div> */}
      </main>
    </div>
  );
}
