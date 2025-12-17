import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Loader2,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// console.log("backend", BACKEND_URL)

const Contact = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Message sent!");
        setIsLoading(false);
        setIsSent(true);
        setFormData({ name: "", email: "", subject: "", message: "" }); // reset form
      } else {
        toast.error("Failed: " + data.error);
      }
    } catch (err) {
      toast.error("Something went wrong");
      setIsSent(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* LEFT SIDE - INFO & VISUALS */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1523966211575-eb4a01e7dd51?q=80&w=1310&auto=format&fit=crop')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 to-slate-900/80"></div>

        {/* Header Content */}
        <div className="relative z-10 text-white mt-10">
          <div className="mb-6 bg-white/10 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10">
            <MessageSquare size={32} className="text-green-400" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Let's Start a <br />
            <span className="text-green-400">Conversation.</span>
          </h1>
          <p className="text-lg text-green-100/80 leading-relaxed max-w-md">
            Whether you want to partner with us, volunteer, or just say hello—we
            are ready to listen.
          </p>
        </div>

        {/* Floating Info Cards */}
        <div className="relative z-10 grid gap-4">
          <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/20 transition-all cursor-default">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs text-green-200 uppercase tracking-wider font-semibold">
                Email Us
              </p>
              <p className="text-white font-medium">support@resqplate.com</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/20 transition-all cursor-default">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-xs text-green-200 uppercase tracking-wider font-semibold">
                Call Us
              </p>
              <p className="text-white font-medium">+91 9999999999</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/20 transition-all cursor-default">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs text-green-200 uppercase tracking-wider font-semibold">
                Visit Us
              </p>
              <p className="text-white font-medium">
                123 Tech City, Innovation Hub, India
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50/50">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Get in Touch
            </h2>
            <p className="text-gray-500">
              Fill out the form and we will get back to you within 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Subject
              </label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none appearance-none cursor-pointer"
              >
                <option>General Inquiry</option>
                <option>Partnership Proposal</option>
                <option>Volunteer Opportunity</option>
                <option>Report an Issue</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Message
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="How can we help you?"
                rows="4"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSent}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 group ${
                isSent
                  ? "bg-green-500 text-white cursor-default"
                  : "bg-green-600 hover:bg-green-700 text-white hover:scale-[1.01] active:scale-[0.98] shadow-green-600/20"
              }`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : isSent ? (
                "Message Sent!"
              ) : (
                <>
                  Send Message{" "}
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
