const { sendEmail } = require("../utils/notifications");

describe("notifications email transport", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.EMAILJS_SERVICE_ID = "service_test";
    process.env.EMAILJS_TEMPLATE_ID = "template_test";
    process.env.EMAILJS_PUBLIC_KEY = "public_test";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  test("sends emails through EmailJS REST API", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "message-123" }),
    });

    const result = await sendEmail({
      to: "volunteer@example.com",
      subject: "New donation match",
      text: "A donation is ready",
      html: "<p>Hello</p>",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.emailjs.com/api/v1.0/email/send",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result.info.messageId).toBe("message-123");
  });

  test("routes notifications to a configured override recipient", async () => {
    process.env.NOTIFICATION_OVERRIDE_EMAIL = "manishkumar.csbs2022@nsec.ac.in";
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "message-456" }),
    });

    await sendEmail({
      to: "real-user@example.com",
      subject: "New donation match",
      text: "A donation is ready",
      html: "<p>Hello</p>",
    });

    const [, options] = global.fetch.mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload.template_params.to_email).toBe(
      "manishkumar.csbs2022@nsec.ac.in",
    );
  });

  test("uses the backend EmailJS newsletter template when provided", async () => {
    delete process.env.EMAILJS_TEMPLATE_ID;
    process.env.EMAILJS_NEWSLETTER_TEMPLATE_ID = "template_backend";
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "message-789" }),
    });

    await sendEmail({
      to: "real-user@example.com",
      subject: "New donation match",
      text: "A donation is ready",
      html: "<p>Hello</p>",
    });

    const [, options] = global.fetch.mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload.template_id).toBe("template_backend");
  });
});
