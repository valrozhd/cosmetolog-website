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
            with the right care
          </h1>
          <p className="intro-copy">
            Personalized skincare treatments grounded in medical knowledge. Each session is built around your skin — its condition, its history, and its needs.
          </p>

          <div className="intro-actions">
            <button className="booking-trigger" type="button">
              Book an appointment
            </button>

            <button className="services-trigger" type="button">
              View services
            </button>
          </div>
        </div>


        <div className="intro-image-wrap">
          <Image
            className="intro-image"
            src="/images/cosmetology-doctor-patien.jpg"
            alt="Cosmetologist in a warm, welcoming skincare studio"
            width={1154}
            height={1402}
          />
        </div>
      </main>
      <footer className="site-footer">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Maryna Salamatina Cosmetology. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
