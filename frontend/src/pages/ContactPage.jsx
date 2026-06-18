import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";

export default function ContactPage() {
  const form = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_NEWSLETTER_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    emailjs
      .sendForm(serviceId, templateId, form.current, publicKey)
      .then(
        (result) => {
          console.log("Email sent successfully:", result.text);
          setStatus("success");
          e.target.reset(); // Clear the form after success
        },
        (error) => {
          console.error("Failed to send email:", error.text);
          setStatus("error");
        },
      )
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen flex flex-col items-center py-20 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-slate-100 mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Have questions about partnering with us, integrating our API, or
            volunteering? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="bg-emerald-900 text-white rounded-3xl p-10 shadow-xl flex flex-col justify-center">
            <h2 className="text-3xl font-serif font-bold mb-8">
              Contact Information
            </h2>

            <div className="space-y-8 text-emerald-100">
              <div className="flex items-center gap-5">
                <div className="bg-emerald-800 p-4 rounded-full text-xl">
                  📍
                </div>
                <span className="text-lg">
                  123 Tech Park, Kolkata, West Bengal, India
                </span>
              </div>
              <div className="flex items-center gap-5">
                <div className="bg-emerald-800 p-4 rounded-full text-xl">
                  ✉️
                </div>
                <span className="text-lg">hello@resqplate.org</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="bg-emerald-800 p-4 rounded-full text-xl">
                  📞
                </div>
                <span className="text-lg">+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-gray-50 dark:bg-slate-900 rounded-3xl p-10 border border-gray-200 dark:border-slate-800">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-slate-100">
              Send us a message
            </h3>

            {status === "success" && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
                ✅ Thank you! Your message has been sent successfully. We will
                get back to you soon.
              </div>
            )}

            {status === "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm font-medium">
                ❌ Oops! Something went wrong. Please try again later.
              </div>
            )}

            <form ref={form} onSubmit={sendEmail} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                {/* Note the 'name' attribute is crucial for EmailJS templates */}
                <input
                  type="text"
                  name="user_name"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="user_email"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  rows="5"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 font-bold rounded-lg transition-all shadow-md text-lg ${
                  isSubmitting
                    ? "bg-emerald-400 text-white cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
