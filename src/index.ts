import { Context, Hono, Next } from "hono";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import factory from "./utils/factory";

const app = factory.createApp().use(async (c: Context, next: Next) => {
	c.set("db", drizzle(c.env.DB, { schema }));
	await next();
});
app.post("/api/email", async (c: Context) => {
	const { email, name } = (await c.req.json()) as Email;
	if (!email || (!name && !email.includes("@"))) {
		return c.json({ error: "Invalid email or name" }, 400);
	}

	try {
		await c.env.DB.insert("leads")
			.values({
				email,
				name,
				status: "pending",
			})
			.onConflictDoNothing();

		const auth = btoa(`${c.env.MAILJET_API_KEY}:${c.env.MAILJET_API_SECRET}`);

		const mailJetResponse = await fetch(
			"https://api.mailjet.com/v3/REST/contact/subscribe",
			{
				method: "POST",
				headers: {
					Authorization: `Basic ${auth}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					Contact: email,
					TemplateID: parseInt(c.env.MAILJET_TEMPLATE_ID),
					TemplateLanguage: true,
					Local: "en_US",
					Sender: {
						Email: c.env.MAILJET_SENDER_EMAIL,
						Name: c.env.MAILJET_SENDER_NAME,
					},
					ContactListID: parseInt(c.env.MAILJET_CONTACT_LIST_ID),
					Variables: { name },
				}),
			}
		);

    if (!mailJetResponse.ok) {
      const error = await mailJetResponse.json();
      return c.json({ error: "Mailjet Error", details: error }, 500);
    }
		return c.json({ message: "Signup Successful" }, 200);
	} catch (error) {
		return c.json({ error: "Error" }, 500);
	}
});

export default app;

interface Email {
	email: string;
	name: string;
}
