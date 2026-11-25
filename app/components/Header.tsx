"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (!isBookingOpen) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsBookingOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isBookingOpen]);

    const openBooking = () => {
        setIsSubmitted(false);
        setIsBookingOpen(true);
    };

    return (
        <>
            <header className="site-header">
                <Link className="site-title" href="/" aria-label="Maryna Salamatina Cosmetology home">
                    Maryna Salamatina
                </Link>

                <nav className="site-nav" aria-label="Main navigation">
                    <a href="#about">About</a>
                    <a href="#services">Services</a>
                    <a href="#results">Results</a>
                    <a href="#faq">FAQ</a>
                    <a href="#contact">Contact</a>
                    <Link href="/account">Sign in</Link>
                </nav>

                <button className="booking-trigger" type="button" onClick={openBooking}>
                    Book appointment
                </button>
            </header>

            {isBookingOpen && (
                <div
                    className="booking-overlay"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsBookingOpen(false);
                        }
                    }}
                >
                    <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
                        <button
                            className="booking-close"
                            type="button"
                            onClick={() => setIsBookingOpen(false)}
                            aria-label="Close booking form"
                        >
                            &times;
                        </button>
                        {isSubmitted ? (
                            <div className="booking-success">
                                <p className="booking-eyebrow">Request received</p>
                                <h2 id="booking-title">Thank you for reaching out.</h2>
                                <p>We will confirm your appointment shortly.</p>
                                <button className="booking-submit" type="button" onClick={() => setIsBookingOpen(false)}>
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    setIsSubmitted(true);
                                }}
                            >
                                <p className="booking-eyebrow">Your skin ritual starts here</p>
                                <h2 id="booking-title">Book an appointment</h2>
                                <p className="booking-description">Choose a date and time that feels right for you.</p>
                                <div className="booking-fields">
                                    <label>
                                        Name
                                        <input name="name" type="text" placeholder="Your name" required />
                                    </label>
                                    <label>
                                        Email
                                        <input name="email" type="email" placeholder="you@example.com" required />
                                    </label>
                                    <label>
                                        Date
                                        <input name="date" type="date" min={new Date().toISOString().split("T")[0]} required />
                                    </label>
                                    <label>
                                        Time
                                        <select name="time" defaultValue="" required>
                                            <option value="" disabled>
                                                Select a time
                                            </option>
                                            <option>10:00 AM</option>
                                            <option>12:00 PM</option>
                                            <option>2:00 PM</option>
                                            <option>4:00 PM</option>
                                        </select>
                                    </label>
                                </div>
                                <button className="booking-submit" type="submit">
                                    Request appointment
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}
